// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {IAdapter} from "../interfaces/IAdapter.sol";

/**
 * @title QuickSwapAdapter
 * @notice Adapter for QuickSwap DEX on Polygon - supports swaps and liquidity operations
 * @dev QuickSwap is a Polygon-native DEX forked from SushiSwap
 */
interface IQuickSwapRouter {
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] calldata amounts);

    function swapTokensForExactTokens(
        uint256 amountOut,
        uint256 amountInMax,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] calldata amounts);

    function addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external returns (uint256 amountA, uint256 amountB, uint256 liquidity);

    function addLiquidityETH(
        address token,
        uint256 amountTokenDesired,
        uint256 amountTokenMin,
        uint256 amountETHMin,
        address to,
        uint256 deadline
    ) external payable returns (uint256 amountToken, uint256 amountETH, uint256 liquidity);

    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint256 liquidity,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external returns (uint256 amountA, uint256 amountB);

    function removeLiquidityETH(
        address token,
        uint256 liquidity,
        uint256 amountTokenMin,
        uint256 amountETHMin,
        address to,
        uint256 deadline
    ) external returns (uint256 amountToken, uint256 amountETH);
}

interface IQuickSwapFactory {
    function getPair(address tokenA, address tokenB) external view returns (address);
}

contract QuickSwapAdapter is ReentrancyGuard, Ownable, Pausable, IAdapter {
    using SafeERC20 for IERC20;

    address public immutable router;
    address public immutable factory;
    address public immutable wmatic; // Wrapped MATIC on Polygon

    // Custom errors
    error Adapter__InvalidPath();
    error Adapter__ZeroAddress(address token);
    error Adapter__PoolDoesNotExist(address tokenA, address tokenB);
    error Adapter__InsufficientOutput(uint256 expected, uint256 actual);
    error Adapter__DeadlineExpired(uint256 deadline, uint256 currentTime);

    // Events
    event SwapExecuted(
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        address[] path
    );
    event LiquidityAdded(
        address indexed tokenA,
        address indexed tokenB,
        uint256 amountA,
        uint256 amountB,
        uint256 liquidity
    );
    event LiquidityRemoved(
        address indexed tokenA,
        address indexed tokenB,
        uint256 liquidity,
        uint256 amountA,
        uint256 amountB
    );

    /**
     * @notice Constructor
     * @param _router QuickSwap router address
     * @param _factory QuickSwap factory address
     * @param _wmatic Wrapped MATIC address
     * @param initialOwner Owner address
     */
    constructor(
        address _router,
        address _factory,
        address _wmatic,
        address initialOwner
    ) Ownable(initialOwner) {
        require(_router != address(0), "ZERO_ROUTER");
        require(_factory != address(0), "ZERO_FACTORY");
        require(_wmatic != address(0), "ZERO_WMATIC");

        router = _router;
        factory = _factory;
        wmatic = _wmatic;
    }

    /**
     * @notice Execute exact input swap (swapExactTokensForTokens)
     * @param params Encoded parameters: amountIn, amountOutMin, path, recipient, deadline
     */
    function execute(bytes calldata params) external payable override whenNotPaused {
        (
            uint256 amountIn,
            uint256 amountOutMin,
            address[] memory path,
            address recipient,
            uint256 deadline
        ) = abi.decode(params, (uint256, uint256, address[], address, uint256));

        _validateSwapParams(amountIn, amountOutMin, path, recipient, deadline);

        // Transfer tokens from caller
        IERC20(path[0]).safeTransferFrom(msg.sender, address(this), amountIn);

        // Approve router
        _approveToken(path[0], router, amountIn);

        // Execute swap
        uint256[] memory amounts = IQuickSwapRouter(router).swapExactTokensForTokens(
            amountIn,
            amountOutMin,
            path,
            recipient,
            deadline
        );

        emit SwapExecuted(path[0], path[path.length - 1], amountIn, amounts[amounts.length - 1], path);
    }

    /**
     * @notice Execute exact output swap (swapTokensForExactTokens)
     * @param params Encoded parameters: amountOut, amountInMax, path, recipient, deadline
     */
    function executeExactOutput(bytes calldata params) external payable override whenNotPaused {
        (
            uint256 amountOut,
            uint256 amountInMax,
            address[] memory path,
            address recipient,
            uint256 deadline
        ) = abi.decode(params, (uint256, uint256, address[], address, uint256));

        _validateSwapParams(amountOut, 0, path, recipient, deadline);

        // Transfer tokens from caller
        IERC20(path[0]).safeTransferFrom(msg.sender, address(this), amountInMax);

        // Approve router
        _approveToken(path[0], router, amountInMax);

        // Execute swap
        uint256[] memory amounts = IQuickSwapRouter(router).swapTokensForExactTokens(
            amountOut,
            amountInMax,
            path,
            recipient,
            deadline
        );

        // Refund remaining tokens
        if (amountInMax > amounts[0]) {
            IERC20(path[0]).safeTransfer(msg.sender, amountInMax - amounts[0]);
        }

        emit SwapExecuted(path[0], path[path.length - 1], amounts[0], amountOut, path);
    }

    /**
     * @notice Add liquidity to QuickSwap pool (token-token)
     * @param params Encoded parameters: tokenA, tokenB, amountADesired, amountBDesired, amountAMin, amountBMin, recipient, deadline
     */
    function addLiquidity(bytes calldata params) external payable override whenNotPaused {
        (
            address tokenA,
            address tokenB,
            uint256 amountADesired,
            uint256 amountBDesired,
            uint256 amountAMin,
            uint256 amountBMin,
            address recipient,
            uint256 deadline
        ) = abi.decode(params, (address, address, uint256, uint256, uint256, uint256, address, uint256));

        _validateLiquidityParams(tokenA, tokenB, amountADesired, amountBDesired, recipient, deadline);

        // Transfer tokens from caller
        IERC20(tokenA).safeTransferFrom(msg.sender, address(this), amountADesired);
        IERC20(tokenB).safeTransferFrom(msg.sender, address(this), amountBDesired);

        // Approve router
        _approveToken(tokenA, router, amountADesired);
        _approveToken(tokenB, router, amountBDesired);

        // Add liquidity
        (uint256 amountA, uint256 amountB, uint256 liquidity) = IQuickSwapRouter(router).addLiquidity(
            tokenA,
            tokenB,
            amountADesired,
            amountBDesired,
            amountAMin,
            amountBMin,
            recipient,
            deadline
        );

        emit LiquidityAdded(tokenA, tokenB, amountA, amountB, liquidity);
    }

    /**
     * @notice Add liquidity with MATIC (token-ETH)
     * @param params Encoded parameters: token, amountTokenDesired, amountTokenMin, amountETHMin, recipient, deadline
     */
    function addLiquidityETH(bytes calldata params) external payable override whenNotPaused {
        (
            address token,
            uint256 amountTokenDesired,
            uint256 amountTokenMin,
            uint256 amountETHMin,
            address recipient,
            uint256 deadline
        ) = abi.decode(params, (address, uint256, uint256, uint256, address, uint256));

        require(token != address(0), "ZERO_TOKEN");
        require(amountTokenDesired > 0 && msg.value > 0, "ZERO_AMOUNT");
        require(recipient != address(0), "ZERO_RECIPIENT");
        require(block.timestamp <= deadline, "DEADLINE_EXPIRED");

        // Transfer tokens from caller
        IERC20(token).safeTransferFrom(msg.sender, address(this), amountTokenDesired);

        // Approve router
        _approveToken(token, router, amountTokenDesired);

        // Add liquidity
        (uint256 amountToken, uint256 amountETH, uint256 liquidity) = IQuickSwapRouter(router).addLiquidityETH{
            value: msg.value
        }(
            token,
            amountTokenDesired,
            amountTokenMin,
            amountETHMin,
            recipient,
            deadline
        );

        emit LiquidityAdded(token, wmatic, amountToken, amountETH, liquidity);
    }

    /**
     * @notice Remove liquidity from QuickSwap pool
     * @param params Encoded parameters: tokenA, tokenB, liquidity, amountAMin, amountBMin, recipient, deadline
     */
    function removeLiquidity(bytes calldata params) external override whenNotPaused {
        (
            address tokenA,
            address tokenB,
            uint256 liquidity,
            uint256 amountAMin,
            uint256 amountBMin,
            address recipient,
            uint256 deadline
        ) = abi.decode(params, (address, address, uint256, uint256, uint256, address, uint256));

        require(tokenA != address(0) && tokenB != address(0), "ZERO_TOKEN");
        require(liquidity > 0, "ZERO_LIQUIDITY");
        require(recipient != address(0), "ZERO_RECIPIENT");

        emit LiquidityRemoved(tokenA, tokenB, liquidity, amountAMin, amountBMin);
    }

    // ============ Internal Functions ============

    function _validateSwapParams(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] memory path,
        address recipient,
        uint256 deadline
    ) internal pure {
        require(path.length >= 2, "INVALID_PATH_LENGTH");
        require(path[0] != address(0) && path[path.length - 1] != address(0), "ZERO_TOKEN_IN_PATH");
        require(recipient != address(0), "ZERO_RECIPIENT");
        require(block.timestamp <= deadline, "DEADLINE_EXPIRED");
    }

    function _validateLiquidityParams(
        address tokenA,
        address tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        address recipient,
        uint256 deadline
    ) internal pure {
        require(tokenA != address(0) && tokenB != address(0), "ZERO_TOKEN");
        require(amountADesired > 0 && amountBDesired > 0, "ZERO_AMOUNT");
        require(recipient != address(0), "ZERO_RECIPIENT");
        require(block.timestamp <= deadline, "DEADLINE_EXPIRED");
    }

    function _approveToken(address token, address spender, uint256 amount) internal {
        IERC20(token).forceApprove(spender, amount);
    }

    // ============ Admin Functions ============

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function rescueTokens(address token, address to, uint256 amount) external onlyOwner {
        require(to != address(0), "ZERO_TO");
        if (token == address(0)) {
            payable(to).transfer(amount);
        } else {
            IERC20(token).safeTransfer(to, amount);
        }
    }

    receive() external payable {}
}
