// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "./Proxy.sol";

contract MainFactoryProxy is Proxy {
    bool public initialized;

    function initialize(address _owner, address _logic, bytes memory _data) public payable {
        require(!initialized, "Already initialized");
        require(_logic != address(0), "Invalid logic address");
        require(_owner != address(0), "Invalid owner address");
        owner = _owner;
        _upgradeToAndCall(_logic, _data, false);
        initialized = true;
    }
}
