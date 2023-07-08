// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract Treasury is Initializable, PausableUpgradeable, OwnableUpgradeable {
    uint256 public version;

    mapping(address => bool) public isRecord;

    function initialize() public initializer {
        __Ownable_init();
        __Pausable_init();
        version = 1;
    }

    function deposit() external payable {
        emit Deposit(msg.sender, msg.value);
    }

    event Deposit(address indexed sender, uint256 amount);

    modifier onlyOwnerOrRecord {
        require(msg.sender == owner() || isRecord[msg.sender], "Caller is not the owner or a record contract");
        _;
    }

    function withdraw(address payable _to, uint256 _amount) external onlyOwnerOrRecord {
        require(address(this).balance >= _amount, "Insufficient balance");
        _to.transfer(_amount);
    }

    function migrate(address payable _newTreasury) external onlyOwner {
        require(_newTreasury != address(0), "Invalid address");
        _newTreasury.transfer(address(this).balance);
    }

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function addRecord(address record) external onlyOwner {
        isRecord[record] = true;
    }

    function removeRecord(address record) external onlyOwner {
        isRecord[record] = false;
    }
}
