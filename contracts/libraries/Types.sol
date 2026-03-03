// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

library Types {
    struct Action {
        address adapter;
        bytes data;
        uint256 value;
    }

    struct ExecutionConfig {
        address inputToken;
        address outputToken;
        uint256 amountIn;
        uint256 minAmountOut;
        uint256 deadline;
    }
}
