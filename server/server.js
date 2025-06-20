const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { parseEther } = require('ethers');
const ethers = require('ethers');
// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors({
    origin: ['http://localhost:5173', 'https://your-frontend-domain.com'],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set strictQuery to false to prepare for Mongoose 7
mongoose.set('strictQuery', false);

// MongoDB Connection with error handling
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: 'mintyscan' // explicitly set database name
})
.then(() => {
    console.log('Connected to MongoDB Atlas successfully');
})
.catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});

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

// Static file serving for production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../client/dist')));
    app.get('/*', (req, res) => {
        res.sendFile(path.join(__dirname, '../client/dist/index.html'));
    });
}

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});