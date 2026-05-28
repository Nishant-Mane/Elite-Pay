// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MilestoneRewards
 * @dev Distributes ETH rewards to users when they cross INR spend milestones.
 *      The backend (trusted operator) calls claimReward() on behalf of users
 *      after verifying milestone eligibility off-chain.
 */
contract MilestoneRewards {
    address public owner;
    address public operator; // backend wallet that calls claimReward

    // ETH reward per milestone (in wei)
    uint256[] public milestoneRewards;

    // user wallet => milestoneIndex => claimed
    mapping(address => mapping(uint256 => bool)) public claimed;

    event RewardClaimed(address indexed user, uint256 milestoneIndex, uint256 amount);
    event FundsDeposited(address indexed from, uint256 amount);
    event OperatorUpdated(address indexed newOperator);
    event RewardAmountsUpdated();

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyOperator() {
        require(msg.sender == operator, "Not operator");
        _;
    }

    constructor(address _operator) {
        owner = msg.sender;
        operator = _operator;

        // Default rewards per milestone (in wei)
        // Milestones: ₹1k, ₹5k, ₹10k, ₹25k, ₹50k
        milestoneRewards.push(0.0001 ether); // ₹1,000 → 0.0001 ETH
        milestoneRewards.push(0.0005 ether); // ₹5,000 → 0.0005 ETH
        milestoneRewards.push(0.001 ether);  // ₹10,000 → 0.001 ETH
        milestoneRewards.push(0.003 ether);  // ₹25,000 → 0.003 ETH
        milestoneRewards.push(0.007 ether);  // ₹50,000 → 0.007 ETH
    }

    /**
     * @dev Called by backend operator after verifying user crossed a milestone.
     * @param user User's ETH wallet address
     * @param milestoneIndex Index into milestoneRewards array
     */
    function claimReward(address user, uint256 milestoneIndex) external onlyOperator {
        require(user != address(0), "Invalid user address");
        require(milestoneIndex < milestoneRewards.length, "Invalid milestone");
        require(!claimed[user][milestoneIndex], "Already claimed");

        uint256 reward = milestoneRewards[milestoneIndex];
        require(address(this).balance >= reward, "Insufficient contract balance");

        claimed[user][milestoneIndex] = true;

        (bool sent, ) = user.call{value: reward}("");
        require(sent, "ETH transfer failed");

        emit RewardClaimed(user, milestoneIndex, reward);
    }

    /**
     * @dev Check if a user has claimed a milestone
     */
    function hasClaimed(address user, uint256 milestoneIndex) external view returns (bool) {
        return claimed[user][milestoneIndex];
    }

    /**
     * @dev Get contract ETH balance
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @dev Update reward amounts (owner only)
     */
    function setMilestoneRewards(uint256[] calldata rewards) external onlyOwner {
        require(rewards.length == milestoneRewards.length, "Length mismatch");
        for (uint256 i = 0; i < rewards.length; i++) {
            milestoneRewards[i] = rewards[i];
        }
        emit RewardAmountsUpdated();
    }

    /**
     * @dev Update operator address
     */
    function setOperator(address _operator) external onlyOwner {
        operator = _operator;
        emit OperatorUpdated(_operator);
    }

    /**
     * @dev Fund the contract with ETH for rewards
     */
    receive() external payable {
        emit FundsDeposited(msg.sender, msg.value);
    }
}
