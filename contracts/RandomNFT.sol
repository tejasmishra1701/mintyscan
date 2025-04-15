// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract RandomNFToken is ERC20, Ownable, ReentrancyGuard {
    using ECDSA for bytes32;

    address public signerAddress;
    mapping(string => bool) public usedUserIds;
    mapping(bytes32 => bool) public usedSignatures; // Changed from bytes to bytes32 for gas efficiency
    
    event TokenMinted(address indexed recipient, uint256 amount, string userId);
    event SignerAddressUpdated(address indexed oldSigner, address indexed newSigner);

    constructor() ERC20("Tictac", "TAC") Ownable(msg.sender) {
        signerAddress = msg.sender;
    }
    
    function setSignerAddress(address _signerAddress) external onlyOwner {
        require(_signerAddress != address(0), "Invalid signer address");
        address oldSigner = signerAddress;
        signerAddress = _signerAddress;
        emit SignerAddressUpdated(oldSigner, _signerAddress);
    }
    
    function mintToken(
        address recipient,
        uint256 amount,
        string calldata userId,
        bytes calldata signature
    ) external nonReentrant returns (bool) {
        require(recipient != address(0), "Invalid recipient address");
        require(amount > 0, "Amount must be greater than 0");
        require(bytes(userId).length > 0, "User ID cannot be empty");
        require(!usedUserIds[userId], "User ID already claimed");
        
        bytes32 signatureHash = keccak256(signature);
        require(!usedSignatures[signatureHash], "Signature already used");
        
        bytes32 messageHash = keccak256(
            abi.encodePacked(
                "\x19Ethereum Signed Message:\n32",
                keccak256(abi.encodePacked(recipient, amount, userId))
            )
        );
        
        address recoveredSigner = ECDSA.recover(messageHash, signature);
        require(recoveredSigner == signerAddress, "Invalid signature");
        
        usedUserIds[userId] = true;
        usedSignatures[signatureHash] = true;
        
        _mint(recipient, amount);
        
        emit TokenMinted(recipient, amount, userId);
        
        return true;
    }
    
    function recoverERC20(
        address tokenAddress,
        uint256 amount
    ) external onlyOwner {
        require(tokenAddress != address(this), "Cannot recover native token");
        require(amount > 0, "Amount must be greater than 0");
        require(
            IERC20(tokenAddress).balanceOf(address(this)) >= amount,
            "Insufficient balance"
        );
        
        IERC20(tokenAddress).transfer(owner(), amount);
    }
}
