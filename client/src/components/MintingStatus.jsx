import { useEffect, useState } from 'react';

function MintingStatus({ status, amount, txHash, account }) {
  const [network, setNetwork] = useState('ethereum');
  
  useEffect(() => {
    // Detect which network we're on
    async function detectNetwork() {
      if (window.ethereum) {
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        
        // Set explorers based on chain ID
        if (chainId === '0x1') {
          setNetwork('ethereum'); // Mainnet
        } else if (chainId === '0x89') {
          setNetwork('polygon'); // Polygon
        } else if (chainId === '0xa86a') {
          setNetwork('avalanche'); // Avalanche
        } else {
          setNetwork('ethereum'); // Default
        }
      }
    }
    
    detectNetwork();
  }, []);
  
  const getExplorerLink = () => {
    const baseUrls = {
      ethereum: 'https://etherscan.io',
      polygon: 'https://polygonscan.com',
      avalanche: 'https://snowtrace.io'
    };
    
    return `${baseUrls[network]}/tx/${txHash}`;
  };
  
  return (
    <div className="minting-container">
      <h2>NFT Minting</h2>
      
      {status === 'minting' && (
        <div className="minting-progress">
          <div className="spinner"></div>
          <p>Minting your NFT... Please wait and don't close this window.</p>
        </div>
      )}
      
      {status === 'success' && (
        <div className="minting-success">
          <h3>Success! 🎉</h3>
          <p>Your NFT has been minted successfully.</p>
          <div className="nft-details">
            <p><strong>Amount:</strong> {amount} tokens</p>
            <p><strong>Wallet:</strong> {account.slice(0, 6)}...{account.slice(-4)}</p>
            <p>
              <strong>Transaction:</strong> 
              <a href={getExplorerLink()} target="_blank" rel="noopener noreferrer">
                View on blockchain
              </a>
            </p>
          </div>
        </div>
      )}
      
      {status === 'failed' && (
        <div className="minting-failed">
          <h3>Minting Failed</h3>
          <p>There was an error minting your NFT. Please try again later.</p>
          {txHash && (
            <p>
              <a href={getExplorerLink()} target="_blank" rel="noopener noreferrer">
                View transaction details
              </a>
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default MintingStatus;