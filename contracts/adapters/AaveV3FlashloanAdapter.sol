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

contract AaveV3FlashloanAdapter is ReentrancyGuard, Ownable, Pausable, IAdapter {
    using SafeERC20 for IERC20;

    address public immutable pool;
    address public immutable weth;

    event FlashLoanExecuted(address indexed asset, uint256 amount, address indexed user, bytes data);

    error Adapter__InvalidToken(address token);
    error Adapter__FlashLoanFailed(address asset, uint256 amount);

    constructor(address _pool, address _weth, address initialOwner) Ownable(initialOwner) {
        require(_pool != address(0), "ZERO_POOL");
        require(_weth != address(0), "ZERO_WETH");
        pool = _pool;
        weth = _weth;
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    function execute(bytes calldata data) external payable nonReentrant whenNotPaused returns (bytes memory) {
        (, address asset, uint256 amount, bytes memory loanParams, uint16 referralCode, address to) = 
            abi.decode(data, (bytes4, address, uint256, bytes, uint16, address));

        if (asset == address(0) || amount == 0) {
            revert Adapter__InvalidToken(asset);
        }

        IERC20(asset).safeTransferFrom(msg.sender, address(this), amount);

        try IAaveV3Pool(pool).flashLoan(to, asset, amount, loanParams, referralCode) {
            // success
        } catch (bytes memory) {
            revert Adapter__FlashLoanFailed(asset, amount);
        }

        emit FlashLoanExecuted(asset, amount, msg.sender, loanParams);
        return abi.encode(true);
    }

    receive() external payable {}
}