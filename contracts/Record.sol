// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./Treasury.sol";

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
        address receiver,
        uint256 claimableAmount
    );

    string public title;
    string public description;
    uint256 public amount;
    uint256 public period;
    address public receiver;
    Treasury public treasury;
    uint256 public lastClaimedAt;
    uint256 public version;

    function initialize(
        string memory _title,
        string memory _description,
        uint256 _amount,
        uint256 _period,
        address _receiver,
        address _treasury
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
        version = 1;
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

    function pause() public onlyOwner {
        if (!paused()) {
            claim();
        }
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function claim() public whenNotPaused {
        require(receiver != address(0), "Invalid receiver address");
        uint256 claimable = claimableAmountDue();

        (bool success, ) = address(treasury).call(
            abi.encodeWithSignature("withdraw(address,uint256)", payable(receiver), claimable)
        );
        if (!success) {
            // Emit an event if claim fails due to low funds in the Treasury
            emit ClaimFailed(receiver, claimable);
        } else {
            // If claim is successful, update the lastClaimedAt
            lastClaimedAt = block.timestamp;
        }
    }

    function claimableAmountDue() internal view returns (uint256) {
        if (block.timestamp < lastClaimedAt) {
            return 0;
        }
        return (block.timestamp - lastClaimedAt) * amount / period;
    }
}
