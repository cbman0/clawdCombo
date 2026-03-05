// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {IAdapter} from "../interfaces/IAdapter.sol";

interface IUniswapV3Pool {
    function swap(address recipient, bool zeroForOne, int256 amountSpecified, uint160 sqrtPriceLimitX96, bytes calldata data)
        external returns (int256 amount0, int256 amount1);
    function mint(address recipient, int24 tickLower, int24 tickUpper, uint128 amount, bytes calldata data)
        external returns (uint256 amount0, uint256 amount1, uint256 liquidity);
    function burn(int24 tickLower, int24 tickUpper, uint128 amount)
        external returns (uint256 amount0, uint256 amount1);
    function token0() external view returns (address);
    function token1() external view returns (address);
}

interface IUniswapV3Factory {
    function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address);
}

contract UniswapV3Adapter is ReentrancyGuard, Ownable, Pausable, IAdapter {
    using SafeERC20 for IERC20;

    address public immutable factory;
    address public immutable weth;

    event SwapExecuted(address indexed tokenIn, address indexed tokenOut, uint256 amountIn, uint256 amountOut, uint24 feeTier);
    event LiquidityAdded(address indexed tokenA, address indexed tokenB, uint24 feeTier, int24 tickLower, int24 tickUpper, uint128 liquidity, uint256 amount0, uint256 amount1);
    event LiquidityRemoved(address indexed tokenA, address indexed tokenB, uint24 feeTier, int24 tickLower, int24 tickUpper, uint128 liquidity, uint256 amount0, uint256 amount1);

    error Adapter__InvalidToken(address token);
    error Adapter__PoolDoesNotExist(address tokenA, address tokenB, uint24 fee);
    error Adapter__InsufficientOutput(uint256 expected, uint256 actual);
    error Adapter__ZeroAddress(address token);

    bytes4 public constant SWAP_EXACT_TOKENS_FOR_TOKENS = 0x18cbb299;
    bytes4 public constant MINT_LIQUIDITY = 0x9565be9e;
    bytes4 public constant BURN_LIQUIDITY = 0x5b6d23e1;

    constructor(address _factory, address _weth, address initialOwner) Ownable(initialOwner) {
        require(_factory != address(0), "ZERO_FACTORY");
        require(_weth != address(0), "ZERO_WETH");
        factory = _factory;
        weth = _weth;
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    function execute(bytes calldata data) external payable nonReentrant whenNotPaused returns (bytes memory) {
        bytes4 action = bytes4(data);

        if (action == SWAP_EXACT_TOKENS_FOR_TOKENS) {
            (uint256 amountIn, uint256 minAmountOut, address tokenIn, address tokenOut, uint24 fee, address to) = 
                abi.decode(data[4:], (uint256, uint256, address, address, uint24, address));
            uint256 amountOut = _swapExactTokensForTokens(amountIn, minAmountOut, tokenIn, tokenOut, fee, to);
            return abi.encode(amountOut);
        } else if (action == MINT_LIQUIDITY) {
            (address tokenA, address tokenB, uint24 fee, int24 tickLower, int24 tickUpper, uint128 liquidity, uint256 amount0Max, uint256 amount1Max, address to) = 
                abi.decode(data[4:], (address, address, uint24, int24, int24, uint128, uint256, uint256, address));
            (, uint256 amount0, uint256 amount1) = _mintLiquidity(tokenA, tokenB, fee, tickLower, tickUpper, liquidity, amount0Max, amount1Max, to);
            return abi.encode(amount0, amount1);
        } else if (action == BURN_LIQUIDITY) {
            (address tokenA, address tokenB, uint24 fee, int24 tickLower, int24 tickUpper, uint128 liquidity) = 
                abi.decode(data[4:], (address, address, uint24, int24, int24, uint128));
            (, uint256 amount0, uint256 amount1) = _burnLiquidity(tokenA, tokenB, fee, tickLower, tickUpper, liquidity);
            return abi.encode(amount0, amount1);
        } else {
            revert("UNSUPPORTED_ACTION");
        }
    }

    function _swapExactTokensForTokens(
        uint256 amountIn,
        uint256 minAmountOut,
        address tokenIn,
        address tokenOut,
        uint24 fee,
        address to
    ) internal returns (uint256 amountOut) {
        if (amountIn == 0) revert Adapter__InvalidToken(address(0));
        if (tokenIn == tokenOut || tokenIn == address(0) || tokenOut == address(0)) revert Adapter__ZeroAddress(tokenIn == address(0) ? tokenIn : tokenOut);

        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);
        address pool = _getPool(tokenIn, tokenOut, fee);
        IUniswapV3Pool poolContract = IUniswapV3Pool(pool);

        // Determine zeroForOne
        address poolToken0 = poolContract.token0();
        bool zeroForOne = (tokenIn == poolToken0);

        uint256 balanceBefore = IERC20(tokenOut).balanceOf(address(this));
        poolContract.swap(address(this), zeroForOne, int256(amountIn), 0, bytes(""));
        uint256 balanceAfter = IERC20(tokenOut).balanceOf(address(this));

        amountOut = balanceAfter - balanceBefore;
        if (amountOut < minAmountOut) {
            revert Adapter__InsufficientOutput(minAmountOut, amountOut);
        }

        IERC20(tokenOut).safeTransfer(to, amountOut);
        emit SwapExecuted(tokenIn, tokenOut, amountIn, amountOut, fee);
    }

    function _mintLiquidity(
        address tokenA,
        address tokenB,
        uint24 fee,
        int24 tickLower,
        int24 tickUpper,
        uint128 liquidity,
        uint256 amount0Max,
        uint256 amount1Max,
        address to
    ) internal returns (bool success, uint256 amount0, uint256 amount1) {
        if (liquidity == 0) revert Adapter__InvalidToken(address(0));
        if (tokenA == address(0) || tokenB == address(0)) revert Adapter__ZeroAddress(tokenA == address(0) ? tokenA : tokenB);

        address pool = _getPool(tokenA, tokenB, fee);
        IUniswapV3Pool poolContract = IUniswapV3Pool(pool);

        address token0 = poolContract.token0();
        bool isA0 = (tokenA == token0);
        uint256 bal0Before = IERC20(token0).balanceOf(address(this));
        uint256 bal1Before = IERC20(isA0 ? tokenB : tokenA).balanceOf(address(this));

        (uint256 mintedAmount0, uint256 mintedAmount1, ) = poolContract.mint(address(this), tickLower, tickUpper, liquidity, bytes(""));

        uint256 bal0After = IERC20(token0).balanceOf(address(this));
        uint256 bal1After = IERC20(isA0 ? tokenB : tokenA).balanceOf(address(this));
        amount0 = bal0After - bal0Before;
        amount1 = bal1After - bal1Before;

        if (amount0 > amount0Max || amount1 > amount1Max) {
            revert Adapter__InsufficientOutput(amount0 > amount0Max ? amount0 : amount1, amount0 > amount0Max ? amount0Max : amount1Max);
        }

        if (amount0 > 0) IERC20(token0).safeTransfer(to, amount0);
        if (amount1 > 0) IERC20(isA0 ? tokenB : tokenA).safeTransfer(to, amount1);

        emit LiquidityAdded(tokenA, tokenB, fee, tickLower, tickUpper, liquidity, amount0, amount1);
        success = true;
    }

    function _burnLiquidity(
        address tokenA,
        address tokenB,
        uint24 fee,
        int24 tickLower,
        int24 tickUpper,
        uint128 liquidity
    ) internal returns (bool success, uint256 amount0, uint256 amount1) {
        address pool = _getPool(tokenA, tokenB, fee);
        IUniswapV3Pool poolContract = IUniswapV3Pool(pool);

        (amount0, amount1) = poolContract.burn(tickLower, tickUpper, liquidity);

        if (amount0 > 0) IERC20(poolContract.token0()).safeTransfer(msg.sender, amount0);
        if (amount1 > 0) IERC20(poolContract.token1()).safeTransfer(msg.sender, amount1);

        emit LiquidityRemoved(tokenA, tokenB, fee, tickLower, tickUpper, liquidity, amount0, amount1);
        success = true;
    }

    function _getPool(address tokenA, address tokenB, uint24 fee) internal view returns (address) {
        address pool = IUniswapV3Factory(factory).getPool(tokenA, tokenB, fee);
        if (pool == address(0)) {
            revert Adapter__PoolDoesNotExist(tokenA, tokenB, fee);
        }
        return pool;
    }

    receive() external payable {}
}