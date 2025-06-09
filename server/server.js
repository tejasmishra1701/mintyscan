const express = require('express');
const cors = require('cors');
const ethers = require('ethers');
const dotenv = require('dotenv');
const path = require('path');
const { MongoClient } = require('mongodb');
const { parseEther } = require('ethers');
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mintyscan';

let db;

// MongoDB Connection
async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
}

// Initialize signing wallet
const PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY;
const wallet = new ethers.Wallet(PRIVATE_KEY);

// Create signing function
// For ethers.js v6
async function createSignature(recipient, amount, userId) {
  // Create the hash using the correct ethers v6 syntax
  const messageHash = ethers.solidityPackedKeccak256(
    ['address', 'uint256', 'string'],
    [recipient, amount, userId]
  );
  
  // Convert the hash to a signable form
  const arrayifiedHash = ethers.getBytes(messageHash);
  
  // Sign the message
  const signature = await wallet.signMessage(arrayifiedHash);
  
  return signature;
}

// Update the leaderboard endpoint
app.get('/api/leaderboard', async (req, res) => {
  try {
    if (!db) {
      throw new Error('Database connection not established');
    }

    const leaderboardData = await db.collection('mints')
      .aggregate([
        {
          $group: {
            _id: '$userId',
            totalAmount: { $sum: { $toDouble: '$amount' } },
            wallet: { $first: '$recipient' }
          }
        },
        {
          $sort: { totalAmount: -1 }
        },
        {
          $project: {
            userId: '$_id',
            totalAmount: { $round: ['$totalAmount', 5] }, // Changed from 6 to 5 decimal places
            wallet: 1,
            _id: 0
          }
        }
      ]).toArray();

    res.json(leaderboardData);
  } catch (error) {
    console.error('Error fetching leaderboard data:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard data' });
  }
});

// Endpoint to generate a signature for minting
app.post('/api/mint-signature', async (req, res) => {
  try {
    const { userId, wallet: recipient, amount } = req.body;
    
    // Log the request data
    console.log("Mint signature request:", { 
      userId, 
      recipient, 
      amount 
    });
    
    // Basic validation
    if (!userId || !recipient || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Check if private key is available
    if (!PRIVATE_KEY) {
      console.error("Missing SIGNER_PRIVATE_KEY in environment variables");
      return res.status(500).json({ error: 'Server configuration error' });
    }
    
    // Convert amount to wei
    const amountInWei = parseEther(amount).toString();
    
    // Store mint transaction with recipient address
    await db.collection('mints').insertOne({
      userId,
      recipient, // This stores the wallet address
      amount: parseFloat(amount),
      timestamp: new Date()
    });
    
    // Create signature
    const signature = await createSignature(recipient, amountInWei, userId);
    console.log("Signature generated successfully");
    
    return res.json({ signature });
  } catch (error) {
    // Detailed error logging
    console.error('Error generating signature:', error.message);
    console.error(error.stack);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
});

const RESET_KEY = 'mintyscan1234';

// Add this new endpoint
app.post('/api/reset-leaderboard', async (req, res) => {
  try {
    const { key } = req.body;
    
    if (key !== RESET_KEY) {
      return res.status(403).json({ error: 'Invalid reset key' });
    }

    // Reset the leaderboard in MongoDB
    await db.collection('mints').deleteMany({});
    
    res.json({ message: 'Leaderboard reset successfully' });
  } catch (error) {
    console.error('Error resetting leaderboard:', error);
    res.status(500).json({ error: 'Failed to reset leaderboard' });
  }
});

// Catch-all for client-side routing in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

// Start server only after connecting to MongoDB
connectToDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});