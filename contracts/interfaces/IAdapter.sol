// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IAdapter {
    function execute(bytes calldata data) external payable returns (bytes memory result);
}
