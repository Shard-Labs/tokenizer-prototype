// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./CfManagerSoftcap.sol";
import "./CfManagerSoftcapFactory.sol";
import "../../issuer/Issuer.sol";
import "../../asset/Asset.sol";
import "../../tokens/USDC.sol";

contract CfManagerSoftcapTest is CfManagerSoftcap {
  address stablecoin = address(new USDC(1000000));
  address issuer = address(new Issuer(1,msg.sender, stablecoin, msg.sender,""));
  address asset = address(new Asset(1, msg.sender, issuer, 1000000 ether, false,
    "ETHC", "ETHC", ""
  ));

  constructor() CfManagerSoftcap(
      1,
      msg.sender,
      asset,
      10000,
      800000,
      false,
      ""){}

    function echidna_test() public pure returns (bool) {
      return true;
    }
}

contract CfManagerSoftcapFactoryTest is CfManagerSoftcapFactory {
    function echidna_test() public pure returns (bool) {
      return true;
    }
}