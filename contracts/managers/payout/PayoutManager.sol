// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "../../asset/IAsset.sol";
import "../../issuer/IIssuer.sol";
import "../payout/IPayoutManager.sol";
import "./IERC20Snapshot.sol";
import "../../shared/Structs.sol";

contract PayoutManager is IPayoutManager {

    using SafeERC20 for IERC20;

    struct Payout {
        uint256 snapshotId;
        string description;
        uint256 amount;
        uint256 totalReleased;
        mapping (address => uint256) released;
    }

    //------------------------
    //  STATE
    //------------------------
    Structs.PayoutManagerState private state;
    Structs.InfoEntry[] private infoHistory;
    Payout[] public payouts;
    mapping (uint256 => uint256) public snapshotToPayout;
    
    //------------------------
    //  EVENTS
    //------------------------
    event CreatePayout(address creator, uint256 payoutId, uint256 amount, uint256 timestamp);
    event Release(address indexed investor, address asset, uint256 payoutId, uint256 amount, uint256 timestamp);
    event SetInfo(string info, address setter, uint256 timestamp);

    //------------------------
    //  CONSTRUCTOR
    //------------------------
    constructor(uint256 id, address owner, address assetAddress, string memory info) {
        state = Structs.PayoutManagerState(
            id,
            owner,
            assetAddress,
            info
        );
    }

    //------------------------
    //  MODIFIERS
    //------------------------
    modifier onlyOwner {
        require(msg.sender == state.owner);
        _;
    }

    //------------------------
    //  STATE CHANGE FUNCTIONS
    //------------------------
    function createPayout(string memory description, uint256 amount) external onlyOwner { 
        require(amount > 0, "Payout Amount Zero");
        _stablecoin().safeTransferFrom(msg.sender, address(this), amount);

        uint256 snapshotId = _asset().snapshot();
        Payout storage payout = payouts.push();
        payout.snapshotId = snapshotId;
        payout.description = description;
        payout.amount = amount;
        snapshotToPayout[snapshotId] = payouts.length - 1;
        
        emit CreatePayout(msg.sender, payouts.length, amount, block.timestamp);
    }

    //------------------------
    //  IPayoutManager IMPL
    //------------------------
    function setInfo(string memory info) external override onlyOwner {
        infoHistory.push(Structs.InfoEntry(
            info,
            block.timestamp
        ));
        state.info = info;
        emit SetInfo(info, msg.sender, block.timestamp);
    }

    /*
        The actual release function allows a user to call it many times
        and he will able to transfer all the payout amount to his account
        Update:
        Add a *** require(payout.released[account] == 0) *** this mean we
        check if the current account has aleary claimed revenue
        
    */
    function release(address account, uint256 snapshotId) external override {
        // require(payout.released[account] == 0, "Account Already Claimed Revenue");
        // require(payout.totalReleased != payout.amount, "Revenue distributed");
        uint256 sharesAtSnapshot = _shares(account, snapshotId);
        require(sharesAtSnapshot > 0, "Account has no shares.");
        
        uint256 payoutId = snapshotToPayout[snapshotId];
        Payout storage payout = payouts[payoutId];

        /*
        There is two function that we can use

        V1 => uint256 payment = payout.amount * sharesAtSnapshot / _asset().totalShares();
        this one we can use it if we check first if the current account already claimed revenue

        V2 =>   uint256 payment = (payout.amount * sharesAtSnapshot / _asset().totalShares()) -
                                payout.released[account]
                require(payment > 0, "Account is not due payment.");

        This second one consume more gas than the V1

        */

        uint256 payment =
            payout.amount * sharesAtSnapshot /
            (_asset().totalShares() - payout.released[account]);
        require(payment != 0, "Account is not due payment.");

        payout.released[account] += payment;
        payout.totalReleased += payment;
        _stablecoin().safeTransfer(account, payment);
        emit Release(account, address(state.asset), payoutId, payment, block.timestamp);
    }

    function totalShares() external view override returns (uint256) {
        return _asset().totalShares();
    }

    function totalReleased(uint256 snapshotId) external view override returns (uint256) {
        return payouts[snapshotToPayout[snapshotId]].totalReleased;
    }

    function shares(address account, uint256 snapshotId) external view override returns (uint256) {
        return _shares(account, snapshotId);
    }

    function released(address account, uint256 snapshotId) external view override returns (uint256) {
        return payouts[snapshotToPayout[snapshotId]].released[account];
    }

    function getInfoHistory() external view override returns (Structs.InfoEntry[] memory) {
        return infoHistory;
    }

    function getState() external view override returns (Structs.PayoutManagerState memory) {
        return state;
    }

    //------------------------
    //  HELPERS
    //------------------------
    function _shares(address account, uint256 snapshotId) internal view returns (uint256) {
        return IERC20Snapshot(state.asset).balanceOfAt(account, snapshotId);
    }

    function _stablecoin() private view returns (IERC20) {
        return IERC20(_issuer().getState().stablecoin);
    }

    function _asset() private view returns (IAsset) {
        return IAsset(state.asset);
    }

    function _issuer() private view returns (IIssuer) {
        return IIssuer(_asset().getState().issuer);
    }

}
