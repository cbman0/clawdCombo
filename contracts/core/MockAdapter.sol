// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IAdapter} from "../interfaces/IAdapter.sol";

contract MockAdapter is IAdapter {
    event MockExecuted(address indexed caller, uint256 value, bytes data);

    function execute(bytes calldata data) external payable returns (bytes memory result) {
        emit MockExecuted(msg.sender, msg.value, data);
        return abi.encode("MOCK_OK", data);
    }
}
