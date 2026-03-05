// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {IAdapter} from "../interfaces/IAdapter.sol";

interface IOneInchRouter {
    function swap(address srcToken, address dstToken, uint256 amount, uint256 minReturnAmount, uint256 flags, bytes calldata data)
        external payable returns (uint256 returnAmount);
}

contract OneInchAdapter is ReentrancyGuard, Ownable, Pausable, IAdapter {
    using SafeERC20 for IERC20;

    address public immutable router;
    address public immutable weth;

    event SwapExecuted(address indexed tokenIn, address indexed tokenOut, uint256 amountIn, uint256 amountOut, bytes data);

    error Adapter__InvalidToken(address token);
    error Adapter__InsufficientReturn(uint256 expected, uint256 actual);

    bytes4 public constant SWAP_EXACT_TOKENS_FOR_TOKENS = 0x18cbb299;
    bytes4 public constant SWAP_EXACT_ETH_FOR_TOKENS = 0x7ff36ab5;
    bytes4 public constant SWAP_TOKENS_FOR_EXACT_ETH = 0xfb3bdb41;

    constructor(address _router, address _weth, address initialOwner) Ownable(initialOwner) {
        require(_router != address(0), "ZERO_ROUTER");
        require(_weth != address(0), "ZERO_WETH");
        router = _router;
        weth = _weth;
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    function execute(bytes calldata data) external payable nonReentrant whenNotPaused returns (bytes memory) {
        bytes4 action = bytes4(data);

        if (action == SWAP_EXACT_TOKENS_FOR_TOKENS) {
            (uint256 amountIn, uint256 minAmountOut, address tokenIn, address tokenOut, bytes memory extraData, address to) = 
                abi.decode(data[4:], (uint256, uint256, address, address, bytes, address));
            IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);
            require(IERC20(tokenIn).approve(router, amountIn), "APPROVE_FAILED");

            uint256 balanceBefore = IERC20(tokenOut).balanceOf(to);
            IOneInchRouter(router).swap{value: 0}(
                tokenIn,
                tokenOut,
                amountIn,
                minAmountOut,
                0,
                extraData
            );
            uint256 balanceAfter = IERC20(tokenOut).balanceOf(to);
            uint256 amountOut = balanceAfter - balanceBefore;

            if (amountOut < minAmountOut) {
                revert Adapter__InsufficientReturn(minAmountOut, amountOut);
            }

            emit SwapExecuted(tokenIn, tokenOut, amountIn, amountOut, extraData);
            return abi.encode(amountOut);
        } else if (action == SWAP_EXACT_ETH_FOR_TOKENS) {
            (uint256 minAmountOut, address tokenOut, bytes memory extraData, address to) = 
                abi.decode(data[4:], (uint256, address, bytes, address));
            if (msg.value == 0) revert Adapter__InvalidToken(address(0));

            uint256 balanceBefore = IERC20(tokenOut).balanceOf(to);
            IOneInchRouter(router).swap{value: msg.value}(
                address(0),
                tokenOut,
                msg.value,
                minAmountOut,
                0,
                extraData
            );
            uint256 balanceAfter = IERC20(tokenOut).balanceOf(to);
            uint256 amountOut = balanceAfter - balanceBefore;

            if (amountOut < minAmountOut) {
                revert Adapter__InsufficientReturn(minAmountOut, amountOut);
            }

            emit SwapExecuted(address(0), tokenOut, msg.value, amountOut, extraData);
            return abi.encode(amountOut);
        } else if (action == SWAP_TOKENS_FOR_EXACT_ETH) {
            (uint256 amountOut, address tokenIn, uint256 maxAmountIn, bytes memory extraData, address to) = 
                abi.decode(data[4:], (uint256, address, uint256, bytes, address));
            IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), maxAmountIn);
            require(IERC20(tokenIn).approve(router, maxAmountIn), "APPROVE_FAILED");

            IOneInchRouter(router).swap{value: 0}(
                tokenIn,
                address(0),
                maxAmountIn,
                amountOut,
                0,
                extraData
            );

            uint256 amountIn = IERC20(tokenIn).balanceOf(address(this));
            if (amountIn > maxAmountIn) {
                IERC20(tokenIn).safeTransfer(msg.sender, amountIn - maxAmountIn);
                amountIn = maxAmountIn;
            }

            payable(to).transfer(address(this).balance);
            if (address(this).balance < amountOut) {
                revert Adapter__InsufficientReturn(amountOut, address(this).balance);
            }

            emit SwapExecuted(tokenIn, address(0), amountIn, amountOut, extraData);
            return abi.encode(amountIn);
        } else {
            revert("UNSUPPORTED_ACTION");
        }
    }

    receive() external payable {}
}