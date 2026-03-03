// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract AdapterRegistry {
    address public owner;
    mapping(address => bool) public isAdapterAllowed;

    event AdapterSet(address indexed adapter, bool allowed);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "NOT_OWNER");
        _;
    }

    constructor(address _owner) {
        require(_owner != address(0), "ZERO_OWNER");
        owner = _owner;
        emit OwnershipTransferred(address(0), _owner);
    }

    function setAdapter(address adapter, bool allowed) external onlyOwner {
        require(adapter != address(0), "ZERO_ADAPTER");
        isAdapterAllowed[adapter] = allowed;
        emit AdapterSet(adapter, allowed);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "ZERO_OWNER");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}
