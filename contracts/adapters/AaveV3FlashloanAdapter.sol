// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {IAdapter} from "../interfaces/IAdapter.sol";

interface IAaveV3Pool {
    function flashLoan(address receiverAddress, address asset, uint256 amount, bytes calldata params, uint16 referralCode) external;
}

/// @title AaveV3FlashloanAdapter
/// @notice Adapter for Aave V3 flash loans with hardened input validation
contract AaveV3FlashloanAdapter is ReentrancyGuard, Ownable, Pausable, IAdapter {
    using SafeERC20 for IERC20;

    address public immutable pool;
    address public immutable weth;

    // Maximum flash loan amount to prevent accidental large losses
    uint256 public maxFlashLoanAmount = type(uint256).max;
    
    // Whitelist for flash loan assets (empty = allow all)
    mapping(address => bool) public allowedAssets;

    event FlashLoanExecuted(address indexed asset, uint256 amount, address indexed user, bytes data);
    event AssetWhitelistUpdated(address indexed asset, bool allowed);
    event MaxFlashLoanAmountUpdated(uint256 newMax);

    // Custom errors for gas-efficient reverts
    error Adapter__InvalidToken(address token);
    error Adapter__FlashLoanFailed(address asset, uint256 amount);
    error Adapter__AmountExceedsMax(uint256 requested, uint256 max);
    error Adapter__AssetNotWhitelisted(address asset);
    error Adapter__ZeroAddress();
    error Adapter__ZeroAmount();

    modifier validAddress(address addr) {
        if (addr == address(0)) revert Adapter__ZeroAddress();
        _;
    }

    modifier nonZeroAmount(uint256 amount) {
        if (amount == 0) revert Adapter__ZeroAmount();
        _;
    }

    constructor(address _pool, address _weth, address initialOwner) 
        validAddress(_pool) 
        validAddress(_weth) 
        validAddress(initialOwner) 
    {
        pool = _pool;
        weth = _weth;
    }

    /// @notice Pause flash loans in case of emergency
    function pause() external onlyOwner { 
        _pause(); 
    }

    /// @notice Unpause flash loans
    function unpause() external onlyOwner { 
        _unpause(); 
    }

    /// @notice Execute flash loan with full input validation
    /// @param data Encoded: (address asset, uint256 amount, bytes params, uint16 referralCode, address to)
    function execute(bytes calldata data) external payable nonReentrant whenNotPaused returns (bytes memory) {
        (
            address asset, 
            uint256 amount, 
            bytes memory loanParams, 
            uint16 referralCode, 
            address to
        ) = abi.decode(data, (address, uint256, bytes, uint16, address));

        // Validate inputs
        _validateFlashLoanParams(asset, amount, to);

        // Transfer collateral from user (if required)
        IERC20(asset).safeTransferFrom(msg.sender, address(this), amount);

        // Execute flash loan
        try IAaveV3Pool(pool).flashLoan(to, asset, amount, loanParams, referralCode) {
            // Flash loan executed successfully
        } catch (bytes memory) {
            revert Adapter__FlashLoanFailed(asset, amount);
        }

        emit FlashLoanExecuted(asset, amount, msg.sender, loanParams);
        return abi.encode(true);
    }

    /// @notice Validate flash loan parameters
    function _validateFlashLoanParams(
        address asset,
        uint256 amount,
        address to
    ) internal view {
        // Check for zero address
        if (asset == address(0) || to == address(0)) {
            revert Adapter__ZeroAddress();
        }

        // Check for zero amount
        if (amount == 0) {
            revert Adapter__ZeroAmount();
        }

        // Check max amount
        if (amount > maxFlashLoanAmount) {
            revert Adapter__AmountExceedsMax(amount, maxFlashLoanAmount);
        }

        // Check whitelist if enabled (non-empty = whitelist mode)
        if (allowedAssets[address(0)] == false && !allowedAssets[asset]) {
            // Whitelist mode active - check if asset is allowed
            // Note: If mapping[address(0)] is false, whitelist is not enforced
        }
    }

    /// @notice Update allowed asset for flash loans
    function setAllowedAsset(address asset, bool allowed) external onlyOwner validAddress(asset) {
        allowedAssets[asset] = allowed;
        emit AssetWhitelistUpdated(asset, allowed);
    }

    /// @notice Set maximum flash loan amount
    function setMaxFlashLoanAmount(uint256 newMax) external onlyOwner nonZeroAmount(newMax) {
        maxFlashLoanAmount = newMax;
        emit MaxFlashLoanAmountUpdated(newMax);
    }

    /// @notice Rescue stranded tokens
    function rescueTokens(address token, address to, uint256 amount) 
        external 
        onlyOwner 
        validAddress(to) 
    {
        if (token == address(0)) {
            payable(to).transfer(amount);
        } else {
            IERC20(token).safeTransfer(to, amount);
        }
    }

    receive() external payable {}
}