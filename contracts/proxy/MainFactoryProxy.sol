// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import {Proxy} from "./Proxy.sol";

contract MainFactoryProxy is Proxy {
    address public mainFactoryLogic;
    address private _owner;

    modifier onlyOwner() {
        require(msg.sender == _owner, "Ownable: caller is not the owner");
        _;
    }

    constructor(address _mainFactoryLogic) {
        mainFactoryLogic = _mainFactoryLogic;
        _owner = msg.sender; // set the owner to be the account deploying the contract
    }

    function _implementation() internal view override returns (address) {
        return mainFactoryLogic;
    }

    function upgradeTo(address newMainFactoryLogic) external onlyOwner {
        mainFactoryLogic = newMainFactoryLogic;
    }

    function getOwner() external view returns (address) {
        return _owner;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        _owner = newOwner;
    }
}
