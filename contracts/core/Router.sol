// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Types} from "../libraries/Types.sol";
import {IAdapter} from "../interfaces/IAdapter.sol";
import {AdapterRegistry} from "./AdapterRegistry.sol";

contract Router {
    AdapterRegistry public immutable registry;

    event ActionExecuted(address indexed adapter, uint256 index, bytes result);

    constructor(address registry_) {
        require(registry_ != address(0), "ZERO_REGISTRY");
        registry = AdapterRegistry(registry_);
    }

    function execute(Types.Action[] calldata actions) external payable {
        uint256 length = actions.length;
        require(length > 0, "NO_ACTIONS");

        for (uint256 i = 0; i < length; i++) {
            Types.Action calldata action = actions[i];
            require(registry.isAdapterAllowed(action.adapter), "ADAPTER_NOT_ALLOWED");

            bytes memory result = IAdapter(action.adapter).execute{value: action.value}(action.data);
            emit ActionExecuted(action.adapter, i, result);
        }
    }
}
