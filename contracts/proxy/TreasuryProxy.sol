// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import {Proxy} from "./Proxy.sol";

contract TreasuryProxy is Proxy {
    address public treasuryLogic;
    address private _owner;

    modifier onlyOwner() {
        require(msg.sender == _owner, "Ownable: caller is not the owner");
        _;
    }

    constructor(address _treasuryLogic) {
        treasuryLogic = _treasuryLogic;
        _owner = msg.sender; // set the owner to be the account deploying the contract
    }

    function _implementation() internal view override returns (address) {
        return treasuryLogic;
    }

    function upgradeTo(address newTreasuryLogic) external onlyOwner {
        treasuryLogic = newTreasuryLogic;
    }

    function getOwner() external view returns (address) {
        return _owner;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        _owner = newOwner;
    }
}
