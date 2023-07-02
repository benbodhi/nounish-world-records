// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./Treasury.sol";
import "./Record.sol";

contract MainFactory is Initializable, PausableUpgradeable, OwnableUpgradeable {
    Treasury public treasury;
    address public executor;
    uint256 public version;
    mapping(address => Record) public recordContracts;

    event ExecutorChanged(address indexed previousExecutor, address indexed newExecutor);
    event ContractCreated(address indexed recordContract);

    function initialize(address _treasury, address _executor) public initializer {
        __Ownable_init();
        __Pausable_init();

        require(_treasury != address(0) && _executor != address(0), "Invalid address");
        treasury = Treasury(_treasury);
        executor = _executor;
        version = 1;
    }

    modifier onlyExecutor() {
        require(msg.sender == executor, "MainFactory: caller is not the executor");
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
    ) external onlyExecutor whenNotPaused returns (address) {
        Record record = new Record();
        record.initialize(_title, _description, _amount, _period, _receiver, address(treasury));
        address recordAddress = address(record);

        recordContracts[recordAddress] = record;
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
    ) public onlyExecutor whenNotPaused {
        Record(_recordContract).updateRecord(_title, _description, _amount, _period, _receiver);
    }

    function pauseRecord(address _recordContract) public whenNotPaused {
        require(msg.sender == owner() || msg.sender == executor, "MainFactory: caller is not the owner or executor");
        Record(_recordContract).pause();
    }

    function unpauseRecord(address _recordContract) public whenNotPaused {
        require(msg.sender == owner() || msg.sender == executor, "MainFactory: caller is not the owner or executor");
        Record(_recordContract).unpause();
    }

    function claimRewardForRecord(address _recordContract) public whenNotPaused {
        Record(_recordContract).claim();
    }
}
