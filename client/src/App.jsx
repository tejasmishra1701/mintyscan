import { useState, useEffect } from 'react';
import { ethers, BrowserProvider, Contract } from 'ethers';
import contractABI from './contractABI.json';
import LeaderBoard from './components/LeaderBoard.jsx';

function App() {
  const [step, setStep] = useState(0); // 0: Connect wallet, 1: Enter user ID, 2: Minting status
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [contract, setContract] = useState(null);
  const [userId, setUserId] = useState('');
  const [mintAmount, setMintAmount] = useState(null);
  const [mintStatus, setMintStatus] = useState('idle'); // idle, minting, success, failed
  const [txHash, setTxHash] = useState('');

  const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

  useEffect(() => {
    const initContract = async () => {
      if (account && provider && CONTRACT_ADDRESS) {
        try {
          const signer = await provider.getSigner();
          const nftContract = new Contract(CONTRACT_ADDRESS, contractABI, signer);
          setContract(nftContract);
          console.log("Contract initialized successfully");
        } catch (error) {
          console.error("Error initializing contract:", error);
        }
      }
    };

    initContract();
  }, [account, provider, CONTRACT_ADDRESS]);

  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
          setAccount(null);
          setProvider(null);
          setContract(null);
          setStep(0);
        } else if (accounts[0] !== account) {
          setAccount(accounts[0]);
        }
      };

      const handleChainChanged = () => {
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [account]);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const provider = new BrowserProvider(window.ethereum);
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });

        if (accounts.length === 0) {
          throw new Error("No accounts authorized");
        }

        const address = accounts[0];
        console.log("Wallet connected:", address);

        setAccount(address);
        setProvider(provider);
        setStep(1);
      } catch (error) {
        console.error("Error connecting wallet:", error);
        alert(`Failed to connect wallet: ${error.message || "Unknown error"}`);
      }
    } else {
      alert("Please install MetaMask or another Web3 wallet!");
    }
  };

  const handleUserIdSubmit = async (e) => {
    e.preventDefault();
    if (!userId.trim()) {
      alert("Please enter a user ID");
      return;
    }

    setStep(2);

    try {
      setMintStatus('minting');

      const randomAmount = Math.random().toFixed(6);
      setMintAmount(randomAmount);

      const response = await fetch('http://localhost:3001/api/mint-signature', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, wallet: account, amount: randomAmount }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }

      const { signature } = await response.json();

      if (!signature) {
        throw new Error("No signature returned from server");
      }

      console.log("Received signature:", signature);
      console.log("Minting with params:", {
        account,
        amount: ethers.parseEther(randomAmount),
        userId,
        signature,
      });

      const tx = await contract.mintToken(
        account,
        ethers.parseEther(randomAmount),
        userId,
        signature
      );
      console.log("Transaction submitted:", tx.hash);
      setTxHash(tx.hash);

      const receipt = await tx.wait();
      console.log("Transaction confirmed:", receipt);
      setMintStatus('success');
    } catch (error) {
      console.error("Error minting NFT:", error);
      setMintStatus('failed');
    }
  };

  const ConnectWalletScreen = () => (
    <div className="flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm p-10 rounded-3xl shadow-2xl border border-green-100 max-w-md w-full mx-auto transform transition-all duration-300 hover:shadow-green-100">
      <div className="w-16 h-16 mb-6 bg-gradient-to-br from-green-500 to-green-700 rounded-full flex items-center justify-center shadow-lg">
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path>
        </svg>
      </div>
      <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-green-700 to-green-900 bg-clip-text text-transparent">Connect Your Wallet</h2>
      <p className="text-gray-600 mb-6 text-lg text-center">Connect your MetaMask wallet to get your Token</p>
      <div className="relative mb-8 p-6 bg-green-50 rounded-2xl border border-green-200 shadow-inner">
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-green-900 text-white text-xs px-4 py-1 rounded-full">REWARD INFO</div>
        <p className="text-green-800 text-center">
          Follow the steps to get some Tictac. The top 5 users in the leaderboard at the end will get some real Tictac from the Developers
        </p>
      </div>
      <button
        onClick={connectWallet}
        className="group relative bg-gradient-to-br from-[#01934f] to-[#004d29] text-white px-10 py-4 rounded-2xl hover:from-[#02af5e] hover:to-[#014928] transform transition-all duration-500 shadow-xl hover:shadow-[#00361d]/20 font-semibold overflow-hidden"
      >
        <span className="relative z-10">Connect MetaMask</span>
        <div className="absolute inset-0 bg-gradient-to-r from-[#00361d] to-[#008849] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
      </button>
    </div>
  );

  const UserIdFormScreen = () => (
    <div className="flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm p-10 rounded-3xl shadow-2xl border border-green-100 max-w-md w-full mx-auto">
      <h2 className="text-3xl font-bold mb-8 bg-gradient-to-r from-green-700 to-green-900 bg-clip-text text-transparent">Enter Your User ID</h2>
      <form onSubmit={handleUserIdSubmit} className="w-full max-w-sm space-y-6">
        <div className="relative">
          <label htmlFor="userId" className="block text-gray-700 font-semibold mb-2 ml-1">
            User ID
          </label>
          <input
            type="text"
            id="userId"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="Enter your user ID"
            required
            autoFocus
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-600 focus:ring-4 focus:ring-green-200 transition-all duration-200"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-[#00361d] to-[#008849]  text-white py-4 rounded-xl hover:from-[#00361d] hover:to-[#008849] transform hover:-translate-y-0.5 transition-all duration-200 shadow-lg hover:shadow-green-200 font-semibold"
        >
          Mint Token
        </button>
      </form>
    </div>
  );

  const MintingStatusScreen = () => {
    const refreshLeaderboard = () => {
      // Force LeaderBoard component to refresh
      setStep(2);
    };

    return (
      <div className="flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm p-10 rounded-3xl shadow-2xl border border-green-100 max-w-md w-full mx-auto">
        <h2 className="text-3xl font-bold mb-8 bg-gradient-to-r from-green-700 to-green-900 bg-clip-text text-transparent">Minting Status</h2>

        {mintStatus === 'minting' && (
          <div className="text-center space-y-6">
            <p className="text-gray-600 text-lg">Minting in progress...</p>
            <div className="loader w-16 h-16 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
          </div>
        )}

        {mintStatus === 'success' && mintAmount && (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 mx-auto bg-green-200 rounded-full flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-green-700">Success {userId}!</h3>
            <div className="p-6 bg-gray-50 rounded-2xl space-y-3">
              <p className="text-gray-600">Token deposited in your account</p>
              <p className="text-lg font-semibold text-green-600">{mintAmount} TAC</p>
              <p className="text-sm text-gray-500">User ID: {userId}</p>
            </div>
            {txHash && (
              <a
                href={`https://etherscan.io/tx/${txHash}`}
                target="_blank"
                rel="noreferrer"
                className="inline-block px-6 py-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors duration-200"
              >
                View on Etherscan
              </a>
            )}
            <div className="mt-8 w-full">
              <LeaderBoard onRefresh={refreshLeaderboard} />
            </div>
          </div>
        )}

        {mintStatus === 'failed' && (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-red-600">Minting Failed</h3>
            <p className="text-gray-600">
              There was an error while minting your Token. Please try again later.
            </p>
            <button
              onClick={() => {
                setMintStatus('idle');
                setStep(1);
              }}
              className="px-8 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transform hover:-translate-y-0.5 transition-all duration-200"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return <ConnectWalletScreen />;
      case 1:
        return <UserIdFormScreen />;
      case 2:
        return <MintingStatusScreen />;
      default:
        return <div>Something went wrong</div>;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-100 via-white to-green-100 relative">
      {/* Header with banner */}
      <header className="bg-gradient-to-r from-[#00361e] to-[#004d29] text-white py-6 px-4 shadow-lg relative z-20">
        <div className="max-w-7xl mx-auto flex items-center justify-center space-x-4">
          <img 
            src="/banner.png" 
            alt="Minty Banner" 
            className="h-10 w-auto object-contain"
          />
          <h1 className="text-4xl font-bold text-center tracking-tight flex items-center">
            <span className="text-green-300">Minty</span>scan
          </h1>
        </div>
      </header>

      {/* Background image container positioned below header */}
      <div 
        className="absolute top-[80px] bottom-0 left-0 right-0 z-0 opacity-50"
        style={{
          backgroundImage: "url('/mintybg.png')",
          backgroundSize: 'contain',
          backgroundPosition: 'center',
          backgroundRepeat: 'repeat',
        }}
      />
      
      <main className="flex-grow flex items-center justify-center p-8 relative z-10">
        <div className="w-full max-w-4xl mx-auto">
          {renderStep()}
        </div>
      </main>

      <footer className="bg-gradient-to-r from-[#00361e] to-[#004d29] text-white py-4 px-4 relative z-20">
        <div className="max-w-7xl mx-auto text-center">
          {account && (
            <p className="font-medium">
              Connected: <span className="bg-[#00361e]/30 px-4 py-1 rounded-full text-sm">{account.slice(0, 6)}...{account.slice(-4)}</span>
            </p>
          )}
        </div>
      </footer>
    </div>
  );
}

export default App;