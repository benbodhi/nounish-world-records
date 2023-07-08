// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {Treasury} from "./Treasury.sol";
import {Record} from "./Record.sol";

contract MainFactory is Initializable, PausableUpgradeable, OwnableUpgradeable {
    Treasury public treasury;
    address public executor;
    uint256 public version;
    mapping(address => Record) public recordContracts;
    address[] public allRecords;

    function getAllRecords() public view returns (address[] memory) {
        return allRecords;
    }

    event ExecutorChanged(address indexed previousExecutor, address indexed newExecutor);
    event ContractCreated(address indexed recordContract);

    function initialize(address payable _treasury, address _executor) public initializer {
        __Ownable_init();
        __Pausable_init();

        require(_treasury != address(0) && _executor != address(0), "Invalid address");
        treasury = Treasury(_treasury);
        executor = _executor;
        version = 1;
    }

    modifier onlyOwnerOrExecutor() {
        require(msg.sender == owner() || msg.sender == executor, "MainFactory: caller is not the owner or executor");
        _;
    }

    function changeExecutor(address _newExecutor) public onlyOwner {
        require(_newExecutor != address(0), "MainFactory: new executor address is zero");
        emit ExecutorChanged(executor, _newExecutor);
        executor = _newExecutor;
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function createRecord(
        string memory _title,
        string memory _description,
        uint256 _amount,
        uint256 _period,
        address _receiver
    ) external onlyOwnerOrExecutor whenNotPaused returns (address) {
        Record record = new Record();
        address payable treasury_payable = payable(address(treasury));
        record.initialize(_title, _description, _amount, _period, _receiver, treasury_payable);
        address recordAddress = address(record);

        recordContracts[recordAddress] = record;
        allRecords.push(recordAddress);
        treasury.addRecord(recordAddress);

        emit ContractCreated(recordAddress);

        return recordAddress;
    }

    function updateRecord(
        address _recordContract,
        string memory _title,
        string memory _description,
        uint256 _amount,
        uint256 _period,
        address _receiver
    ) public onlyOwnerOrExecutor whenNotPaused {
        Record(_recordContract).updateRecord(_title, _description, _amount, _period, _receiver);
    }

    function pauseRecord(address _recordContract) public onlyOwnerOrExecutor whenNotPaused {
        Record(_recordContract).pause();
    }

    function unpauseRecord(address _recordContract) public onlyOwnerOrExecutor whenNotPaused {
        Record(_recordContract).unpause();
    }

    function claimRewardForRecord(address _recordContract) public whenNotPaused {
        Record(_recordContract).claim();
    }
}
