function WalletConnect({ connectWallet }) {
    return (
      <div className="wallet-container">
        <h2>Connect Your Wallet</h2>
        <p>Please connect your MetaMask wallet to continue</p>
        <button onClick={connectWallet} className="connect-button">
          Connect MetaMask
        </button>
        <div className="wallet-info">
          <p>You'll need MetaMask installed to use this app.</p>
          <p>Don't have MetaMask yet? <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer">Download here</a></p>
        </div>
      </div>
    );
  }
  
  export default WalletConnect;