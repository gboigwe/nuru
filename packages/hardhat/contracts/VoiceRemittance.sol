// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title VoiceRemittance
 * @dev Smart contract for voice-powered crypto remittances using ENS names
 * @author VoicePay Africa Team
 * 
 * Core Features:
 * - Voice-initiated payments using ENS names
 * - IPFS storage of voice receipts via Web3.Storage
 * - Multi-currency support (ETH, USDC on Base)
 * - Reputation tracking for EFP integration
 * - Secure escrow mechanism
 */
contract VoiceRemittance is ReentrancyGuard, Pausable, Ownable, AccessControl {
    uint256 private _orderCounter;

    // USDC Token Interface
    IERC20 public usdcToken;

    // Structs
    struct PaymentOrder {
        uint256 id;
        address sender;
        string recipientENS;
        address recipientAddress;
        uint256 amount;
        string voiceReceiptHash; // IPFS hash of voice recording
        uint256 timestamp;
        bool completed;
        string currency; // "ETH", "USDC", etc.
        uint8 status; // 0: pending, 1: completed, 2: cancelled, 3: disputed
        string metadata; // Additional payment metadata
    }
    
    struct UserProfile {
        uint256 totalSent;
        uint256 totalReceived;
        uint256 transactionCount;
        uint256 reputationScore; // For EFP integration
        bool isVerified;
        string ensName;
        uint256 lastActivity;
    }
    
    // Storage
    mapping(uint256 => PaymentOrder) public orders;
    mapping(address => UserProfile) public userProfiles;
    mapping(string => address) public ensToAddress; // ENS name -> address cache
    mapping(address => string) public addressToENS; // Reverse ENS cache
    mapping(address => uint256[]) public userOrders; // User's payment orders
    
    // Constants and Configuration
    uint256 public constant MAX_PAYMENT_AMOUNT = 1000 ether; // Safety limit
    uint256 public constant MIN_PAYMENT_AMOUNT = 0.001 ether;
    uint256 public platformFeePercent = 50; // 0.5% (50/10000)
    uint256 public constant MAX_FEE_PERCENT = 300; // 3% maximum
    
    // Timelock
    uint256 public constant TIMELOCK_PERIOD = 7 days;
    mapping(bytes32 => uint256) public timelockQueue;
    
    // Transaction Limits
    uint256 public maxPaymentPerTx = 10_000 * 10**6; // 10k USDC
    uint256 public maxPaymentPerDay = 50_000 * 10**6; // 50k USDC
    mapping(address => uint256) public dailyVolume;
    mapping(address => uint256) public lastResetDay;
    
    // Circuit Breaker
    bool public emergencyShutdown;
    uint256 public emergencyWithdrawDelay = 3 days;
    uint256 public pausedAt;
    
    // Rate Limiting
    mapping(address => uint256) public lastPaymentTime;
    uint256 public minTimeBetweenPayments = 10 seconds;
    
    // Access Control Roles
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    
    event FeeChangeQueued(uint256 newFee, uint256 executeTime);
    event FeeChangeExecuted(uint256 oldFee, uint256 newFee);
    event DailyLimitExceeded(address user, uint256 attempted, uint256 limit);
    event EmergencyShutdown(uint256 timestamp);
    event EmergencyWithdrawal(uint256 amount);
    
    // Events
    event PaymentInitiated(
        uint256 indexed orderId, 
        address indexed sender, 
        string recipientENS, 
        uint256 amount,
        string currency,
        string voiceHash
    );
    
    event PaymentCompleted(
        uint256 indexed orderId, 
        address indexed recipient, 
        uint256 amount,
        uint256 fee
    );
    
    event PaymentCancelled(
        uint256 indexed orderId,
        address indexed sender,
        string reason
    );
    
    event ENSAddressUpdated(
        string indexed ensName,
        address indexed oldAddress,
        address indexed newAddress
    );
    
    event VoiceReceiptStored(
        uint256 indexed orderId,
        string voiceHash,
        uint256 timestamp
    );
    
    event ReputationUpdated(
        address indexed user,
        uint256 oldScore,
        uint256 newScore
    );
    
    // Modifiers
    modifier validPaymentAmount(uint256 _amount) {
        require(_amount >= MIN_PAYMENT_AMOUNT, "Payment amount too small");
        require(_amount <= MAX_PAYMENT_AMOUNT, "Payment amount too large");
        _;
    }
    
    modifier orderExists(uint256 _orderId) {
        require(_orderId > 0 && _orderId <= _orderCounter, "Order does not exist");
        _;
    }
    
    modifier onlySender(uint256 _orderId) {
        require(orders[_orderId].sender == msg.sender, "Not the order sender");
        _;
    }
    
    modifier withinLimits(uint256 _amount) {
        require(_amount <= maxPaymentPerTx, "Exceeds per-tx limit");
        
        if (block.timestamp / 1 days > lastResetDay[msg.sender]) {
            dailyVolume[msg.sender] = 0;
            lastResetDay[msg.sender] = block.timestamp / 1 days;
        }
        
        require(
            dailyVolume[msg.sender] + _amount <= maxPaymentPerDay,
            "Exceeds daily limit"
        );
        
        dailyVolume[msg.sender] += _amount;
        _;
    }
    
    modifier rateLimit() {
        require(
            block.timestamp >= lastPaymentTime[msg.sender] + minTimeBetweenPayments,
            "Rate limit"
        );
        lastPaymentTime[msg.sender] = block.timestamp;
        _;
    }
    
    constructor(address _usdcAddress) Ownable(msg.sender) {
        require(_usdcAddress != address(0), "Invalid USDC address");
        usdcToken = IERC20(_usdcAddress);
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(OPERATOR_ROLE, msg.sender);
    }
    
    /**
     * @dev Initiate a voice payment using ENS name
     * @param _recipientENS The ENS name of the recipient
     * @param _voiceHash IPFS hash of the voice recording
     * @param _currency Currency type ("ETH", "USDC", etc.)
     * @param _metadata Additional payment metadata
     */
    function initiatePayment(
        string memory _recipientENS,
        string memory _voiceHash,
        string memory _currency,
        string memory _metadata
    ) external payable nonReentrant whenNotPaused validPaymentAmount(msg.value) rateLimit {
        require(bytes(_recipientENS).length > 0, "ENS name cannot be empty");
        require(bytes(_recipientENS).length <= 256, "ENS name too long");
        require(bytes(_voiceHash).length > 0, "Voice hash cannot be empty");
        require(bytes(_voiceHash).length <= 128, "Voice hash too long");
        require(msg.value > 0, "Payment amount must be greater than 0");
        require(msg.sender != address(0), "Invalid sender");
        
        _orderCounter++;
        uint256 orderId = _orderCounter;
        
        // Create payment order
        orders[orderId] = PaymentOrder({
            id: orderId,
            sender: msg.sender,
            recipientENS: _recipientENS,
            recipientAddress: address(0), // Will be resolved later
            amount: msg.value,
            voiceReceiptHash: _voiceHash,
            timestamp: block.timestamp,
            completed: false,
            currency: _currency,
            status: 0, // pending
            metadata: _metadata
        });
        
        // Add order to user's list
        userOrders[msg.sender].push(orderId);
        
        // Update user profile
        _updateUserProfile(msg.sender, msg.value, 0, true);
        
        emit PaymentInitiated(orderId, msg.sender, _recipientENS, msg.value, _currency, _voiceHash);
        emit VoiceReceiptStored(orderId, _voiceHash, block.timestamp);
    }

    /**
     * @dev Initiate a USDC payment directly to an address
     * @param _recipientAddress The recipient address
     * @param _amount USDC amount (in USDC decimals - 6 decimals)
     * @param _voiceHash IPFS hash of the voice recording
     * @param _metadata Additional payment metadata
     */
    function initiateUSDCPayment(
        address _recipientAddress,
        uint256 _amount,
        string memory _voiceHash,
        string memory _metadata
    ) external nonReentrant whenNotPaused withinLimits(_amount) rateLimit {
        require(_recipientAddress != address(0), "Invalid recipient address");
        require(_recipientAddress != msg.sender, "Cannot send to yourself");
        require(_recipientAddress != address(this), "Cannot send to contract");
        require(_amount > 0, "Payment amount must be greater than 0");
        require(_amount >= 1000, "Amount too small"); // Min 0.001 USDC
        require(bytes(_voiceHash).length > 0, "Voice hash cannot be empty");
        require(bytes(_voiceHash).length <= 128, "Voice hash too long");

        // Transfer USDC from sender to this contract
        require(
            usdcToken.transferFrom(msg.sender, address(this), _amount),
            "USDC transfer failed - check allowance"
        );

        _orderCounter++;
        uint256 orderId = _orderCounter;

        // Calculate platform fee
        uint256 fee = (_amount * platformFeePercent) / 10000;
        uint256 netAmount = _amount - fee;

        // Create payment order (already completed since USDC transfer succeeded)
        orders[orderId] = PaymentOrder({
            id: orderId,
            sender: msg.sender,
            recipientENS: "", // Direct address payment, no ENS
            recipientAddress: _recipientAddress,
            amount: _amount,
            voiceReceiptHash: _voiceHash,
            timestamp: block.timestamp,
            completed: true, // Immediately completed
            currency: "USDC",
            status: 1, // completed
            metadata: _metadata
        });

        // Add order to user's list
        userOrders[msg.sender].push(orderId);

        // Update user profiles
        _updateUserProfile(msg.sender, _amount, 0, true);
        _updateUserProfile(_recipientAddress, 0, netAmount, false);

        // Transfer USDC to recipient
        require(
            usdcToken.transfer(_recipientAddress, netAmount),
            "USDC transfer to recipient failed"
        );

        // Transfer fee to platform owner
        if (fee > 0) {
            require(
                usdcToken.transfer(owner(), fee),
                "Fee transfer failed"
            );
        }

        // Update reputation scores
        _updateReputation(msg.sender, 10);
        _updateReputation(_recipientAddress, 5);

        emit PaymentInitiated(orderId, msg.sender, "", _amount, "USDC", _voiceHash);
        emit VoiceReceiptStored(orderId, _voiceHash, block.timestamp);
        emit PaymentCompleted(orderId, _recipientAddress, netAmount, fee);
    }

    /**
     * @dev Complete payment by resolving ENS and transferring funds
     * @param _orderId The order ID to complete
     * @param _recipientAddress The resolved address of the ENS name
     */
    function completePayment(
        uint256 _orderId,
        address _recipientAddress
    ) external nonReentrant whenNotPaused orderExists(_orderId) rateLimit {
        PaymentOrder storage order = orders[_orderId];
        require(!order.completed, "Order already completed");
        require(order.status == 0, "Order is not in pending status");
        require(_recipientAddress != address(0), "Invalid recipient address");
        require(_recipientAddress != order.sender, "Cannot send to yourself");
        
        // Verify ENS resolution (this would typically be done by an oracle or resolver)
        // For MVP, we accept the provided address
        order.recipientAddress = _recipientAddress;
        order.completed = true;
        order.status = 1; // completed
        
        // Calculate platform fee
        uint256 fee = (order.amount * platformFeePercent) / 10000;
        uint256 netAmount = order.amount - fee;
        
        // Update ENS cache
        _updateENSCache(order.recipientENS, _recipientAddress);
        
        // Update recipient profile
        _updateUserProfile(_recipientAddress, 0, netAmount, false);
        
        // Transfer funds
        (bool success, ) = _recipientAddress.call{value: netAmount}("");
        require(success, "Transfer to recipient failed");
        
        // Transfer fee to platform (contract owner)
        if (fee > 0) {
            (bool feeSuccess, ) = owner().call{value: fee}("");
            require(feeSuccess, "Fee transfer failed");
        }
        
        // Update reputation scores
        _updateReputation(order.sender, 10); // Sender gets reputation for sending
        _updateReputation(_recipientAddress, 5); // Recipient gets smaller reputation boost
        
        emit PaymentCompleted(_orderId, _recipientAddress, netAmount, fee);
    }
    
    /**
     * @dev Cancel a pending payment order
     * @param _orderId The order ID to cancel
     * @param _reason Reason for cancellation
     */
    function cancelPayment(
        uint256 _orderId,
        string memory _reason
    ) external nonReentrant orderExists(_orderId) onlySender(_orderId) {
        PaymentOrder storage order = orders[_orderId];
        require(!order.completed, "Cannot cancel completed order");
        require(order.status == 0, "Order is not in pending status");
        
        order.status = 2; // cancelled
        
        // Refund the sender
        (bool success, ) = order.sender.call{value: order.amount}("");
        require(success, "Refund failed");
        
        emit PaymentCancelled(_orderId, order.sender, _reason);
    }
    
    /**
     * @dev Update ENS address cache
     * @param _ensName ENS domain name
     * @param _address Resolved address
     */
    function _updateENSCache(string memory _ensName, address _address) private {
        address oldAddress = ensToAddress[_ensName];
        ensToAddress[_ensName] = _address;
        addressToENS[_address] = _ensName;
        
        if (oldAddress != _address) {
            emit ENSAddressUpdated(_ensName, oldAddress, _address);
        }
    }
    
    /**
     * @dev Update user profile statistics
     * @param _user User address
     * @param _sentAmount Amount sent (0 if not applicable)
     * @param _receivedAmount Amount received (0 if not applicable)
     * @param _isSender Whether this is a sender transaction
     */
    function _updateUserProfile(
        address _user,
        uint256 _sentAmount,
        uint256 _receivedAmount,
        bool _isSender
    ) private {
        UserProfile storage profile = userProfiles[_user];
        
        if (_isSender) {
            profile.totalSent += _sentAmount;
        } else {
            profile.totalReceived += _receivedAmount;
        }
        
        profile.transactionCount++;
        profile.lastActivity = block.timestamp;
        
        // Auto-verify users after 5 successful transactions
        if (profile.transactionCount >= 5 && !profile.isVerified) {
            profile.isVerified = true;
        }
    }
    
    /**
     * @dev Update user reputation score
     * @param _user User address
     * @param _points Reputation points to add
     */
    function _updateReputation(address _user, uint256 _points) private {
        UserProfile storage profile = userProfiles[_user];
        uint256 oldScore = profile.reputationScore;
        profile.reputationScore += _points;
        
        emit ReputationUpdated(_user, oldScore, profile.reputationScore);
    }
    
    // View Functions
    
    /**
     * @dev Get payment order details
     * @param _orderId The order ID to query
     */
    function getOrder(uint256 _orderId) external view orderExists(_orderId) returns (PaymentOrder memory) {
        return orders[_orderId];
    }
    
    /**
     * @dev Get user profile
     * @param _user User address to query
     */
    function getUserProfile(address _user) external view returns (UserProfile memory) {
        return userProfiles[_user];
    }
    
    /**
     * @dev Get user's payment order IDs
     * @param _user User address to query
     */
    function getUserOrders(address _user) external view returns (uint256[] memory) {
        return userOrders[_user];
    }
    
    /**
     * @dev Get total number of orders
     */
    function getTotalOrders() external view returns (uint256) {
        return _orderCounter;
    }
    
    /**
     * @dev Resolve ENS name to address (cached)
     * @param _ensName ENS domain name
     */
    function resolveENS(string memory _ensName) external view returns (address) {
        return ensToAddress[_ensName];
    }
    
    /**
     * @dev Get ENS name from address (reverse lookup)
     * @param _address Address to query
     */
    function reverseResolveENS(address _address) external view returns (string memory) {
        return addressToENS[_address];
    }
    
    // Admin Functions
    
    /**
     * @dev Queue platform fee change (only owner)
     * @param _newFeePercent New fee percentage (in basis points)
     */
    function queueFeeChange(uint256 _newFeePercent) external onlyOwner {
        require(_newFeePercent <= MAX_FEE_PERCENT, "Fee too high");
        bytes32 txHash = keccak256(abi.encode('SET_FEE', _newFeePercent));
        timelockQueue[txHash] = block.timestamp + TIMELOCK_PERIOD;
        emit FeeChangeQueued(_newFeePercent, timelockQueue[txHash]);
    }
    
    /**
     * @dev Execute platform fee change after timelock
     * @param _newFeePercent New fee percentage (in basis points)
     */
    function executeFeeChange(uint256 _newFeePercent) external onlyOwner {
        bytes32 txHash = keccak256(abi.encode('SET_FEE', _newFeePercent));
        require(timelockQueue[txHash] != 0, "Not queued");
        require(block.timestamp >= timelockQueue[txHash], "Timelock active");
        
        uint256 oldFee = platformFeePercent;
        platformFeePercent = _newFeePercent;
        delete timelockQueue[txHash];
        
        emit FeeChangeExecuted(oldFee, _newFeePercent);
    }
    
    /**
     * @dev Pause contract (emergency use)
     */
    function pause() external onlyOwner {
        pausedAt = block.timestamp;
        _pause();
    }
    
    /**
     * @dev Unpause contract
     */
    function unpause() external onlyOwner {
        require(!emergencyShutdown, "Emergency shutdown active");
        _unpause();
    }
    
    /**
     * @dev Trigger emergency shutdown
     */
    function triggerEmergencyShutdown() external onlyOwner {
        emergencyShutdown = true;
        pausedAt = block.timestamp;
        _pause();
        emit EmergencyShutdown(block.timestamp);
    }
    
    /**
     * @dev Emergency withdrawal (only owner, after delay)
     */
    function emergencyWithdraw() external onlyOwner {
        require(emergencyShutdown, "Not in emergency");
        require(
            block.timestamp >= pausedAt + emergencyWithdrawDelay,
            "Wait period active"
        );
        
        uint256 balance = address(this).balance;
        (bool success, ) = owner().call{value: balance}("");
        require(success, "Emergency withdrawal failed");
        
        emit EmergencyWithdrawal(balance);
    }
    
    /**
     * @dev Update user verification status (for KYC/AML compliance)
     * @param _user User address
     * @param _verified Verification status
     */
    function updateUserVerification(address _user, bool _verified) external onlyOwner {
        userProfiles[_user].isVerified = _verified;
    }
    
    /**
     * @dev Manually update ENS cache (for testing/admin purposes)
     * @param _ensName ENS domain name
     * @param _address Resolved address
     */
    function updateENSCache(string memory _ensName, address _address) external onlyOwner {
        _updateENSCache(_ensName, _address);
    }
    
    // Fallback and Receive
    receive() external payable {
        // Accept ETH deposits
    }
    
    fallback() external payable {
        // Accept ETH deposits
    }
}
