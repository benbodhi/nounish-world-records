// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {Treasury} from "./Treasury.sol";

contract Record is Initializable, PausableUpgradeable, OwnableUpgradeable {
    event RecordUpdated(
        string title,
        string description,
        uint256 amount,
        uint256 period,
        address receiver,
        uint256 version
    );
    event ClaimFailed(
        address indexed receiver,
        uint256 claimable,
        uint256 treasuryBalance,
        string reason
    );

    string public title;
    string public description;
    uint256 public amount;
    uint256 public period;
    address public receiver;
    Treasury public treasury;
    uint256 public createdAt;
    uint256 public lastClaimedAt;
    uint256 public totalClaimed;
    uint256 public totalPausedTime;
    uint256 public version;

    function initialize(
        string memory _title,
        string memory _description,
        uint256 _amount,
        uint256 _period,
        address _receiver,
        address payable _treasury
    ) public initializer {
        __Ownable_init();
        __Pausable_init();

        title = _title;
        description = _description;
        amount = _amount;
        period = _period;
        receiver = _receiver;
        treasury = Treasury(_treasury);
        lastClaimedAt = block.timestamp;
        totalClaimed = 0;
        version = 1;
        createdAt = block.timestamp;
        totalPausedTime = 0;
    }

    function updateRecord(
        string memory _title,
        string memory _description,
        uint256 _amount,
        uint256 _period,
        address _receiver
    ) public onlyOwner {
        if (!paused()) {
            claim();
        }

        title = _title;
        description = _description;
        amount = _amount;
        period = _period;
        receiver = _receiver;
    }

    function getOwner() external view returns (address) {
        return owner();
    }

    function pause() public onlyOwner {
        if (!paused()) {
            claim();
            totalPausedTime += block.timestamp - lastClaimedAt;
        }
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
        lastClaimedAt = block.timestamp - totalPausedTime;
    }

    function claimableAmountDue() public view returns (uint256) {
        uint256 elapsedTime = block.timestamp - lastClaimedAt;
        uint256 claimable = elapsedTime * amount / period;
        return claimable;
    }

    function getClaimableAmountDue() public view returns (uint256) {
        return claimableAmountDue();
    }

    function claim() public whenNotPaused {
        require(receiver != address(0), "Invalid receiver address");
        uint256 claimable = claimableAmountDue();

        (bool success, ) = address(treasury).call(
            abi.encodeWithSignature("withdraw(address,uint256)", payable(receiver), claimable)
        );

        if (success) {
            // If claim is successful, update the lastClaimedAt and totalClaimed
            lastClaimedAt = block.timestamp;
            totalClaimed += claimable;
        } else {
            // Emit an event if claim fails due to low funds in the Treasury
            uint256 treasuryBalance = treasury.getBalance();
            emit ClaimFailed(receiver, claimable, treasuryBalance, "Claim failed due to insufficient funds in Treasury");
        }
    }
}
