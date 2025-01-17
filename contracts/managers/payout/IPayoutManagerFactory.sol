// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IPayoutManagerFactory {
    function create(address owner, address assetAddress, string memory info) external returns (address);
    function getInstances() external view returns (address[] memory);
    function getInstancesForIssuer(address issuer) external view returns (address[] memory);
    function getInstancesForAsset(address assset) external view returns (address[] memory);
}
