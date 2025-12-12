// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title PaymentReceipt
 * @dev ERC721 NFT contract for payment receipts
 * Mints NFTs as immutable proof of payment transactions
 */
contract PaymentReceipt is ERC721, ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    struct Receipt {
        address sender;
        address recipient;
        uint256 amount;
        string currency;
        uint256 timestamp;
        bytes32 transactionHash;
    }

    // Mapping from token ID to receipt data
    mapping(uint256 => Receipt) public receipts;

    // Mapping from transaction hash to token ID
    mapping(bytes32 => uint256) public transactionToTokenId;

    // Events
    event ReceiptMinted(
        uint256 indexed tokenId,
        address indexed sender,
        address indexed recipient,
        uint256 amount,
        string currency,
        bytes32 transactionHash
    );

    constructor() ERC721("Nuru Payment Receipt", "NURU-RECEIPT") Ownable(msg.sender) {}

    /**
     * @dev Mint a new payment receipt NFT
     * @param to Address to mint the receipt to (usually sender)
     * @param sender Payment sender address
     * @param recipient Payment recipient address
     * @param amount Payment amount
     * @param currency Currency symbol (e.g., "USDC")
     * @param txHash Original payment transaction hash
     * @param tokenURI IPFS URI for receipt metadata
     * @return tokenId The ID of the newly minted receipt NFT
     */
    function mintReceipt(
        address to,
        address sender,
        address recipient,
        uint256 amount,
        string memory currency,
        bytes32 txHash,
        string memory tokenURI
    ) public returns (uint256) {
        require(transactionToTokenId[txHash] == 0, "Receipt already minted for this transaction");

        _tokenIdCounter.increment();
        uint256 tokenId = _tokenIdCounter.current();

        // Store receipt data
        receipts[tokenId] = Receipt({
            sender: sender,
            recipient: recipient,
            amount: amount,
            currency: currency,
            timestamp: block.timestamp,
            transactionHash: txHash
        });

        // Map transaction hash to token ID
        transactionToTokenId[txHash] = tokenId;

        // Mint NFT
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);

        emit ReceiptMinted(tokenId, sender, recipient, amount, currency, txHash);

        return tokenId;
    }

    /**
     * @dev Get receipt data for a token ID
     * @param tokenId The token ID to query
     * @return Receipt struct containing payment details
     */
    function getReceipt(uint256 tokenId) public view returns (Receipt memory) {
        require(_ownerOf(tokenId) != address(0), "Receipt does not exist");
        return receipts[tokenId];
    }

    /**
     * @dev Get token ID for a transaction hash
     * @param txHash The transaction hash to query
     * @return tokenId The token ID (0 if not found)
     */
    function getTokenIdByTransaction(bytes32 txHash) public view returns (uint256) {
        return transactionToTokenId[txHash];
    }

    /**
     * @dev Get all receipts owned by an address
     * @param owner The address to query
     * @return tokenIds Array of token IDs owned by the address
     */
    function getReceiptsByOwner(address owner) public view returns (uint256[] memory) {
        uint256 balance = balanceOf(owner);
        uint256[] memory tokenIds = new uint256[](balance);
        uint256 currentIndex = 0;

        for (uint256 i = 1; i <= _tokenIdCounter.current(); i++) {
            if (_ownerOf(i) == owner) {
                tokenIds[currentIndex] = i;
                currentIndex++;
            }
        }

        return tokenIds;
    }

    /**
     * @dev Get total number of receipts minted
     * @return Total receipt count
     */
    function totalSupply() public view returns (uint256) {
        return _tokenIdCounter.current();
    }

    /**
     * @dev Verify receipt data matches on-chain data
     * @param tokenId Token ID to verify
     * @param sender Expected sender address
     * @param recipient Expected recipient address
     * @param amount Expected amount
     * @param txHash Expected transaction hash
     * @return bool True if all data matches
     */
    function verifyReceipt(
        uint256 tokenId,
        address sender,
        address recipient,
        uint256 amount,
        bytes32 txHash
    ) public view returns (bool) {
        Receipt memory receipt = getReceipt(tokenId);

        return (
            receipt.sender == sender &&
            receipt.recipient == recipient &&
            receipt.amount == amount &&
            receipt.transactionHash == txHash
        );
    }

    // Override required functions
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
