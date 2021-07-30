// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./PayoutManager.sol";
import "./PayoutManagerFactory.sol";
import "../../issuer/Issuer.sol";
import "../../asset/Asset.sol";
import "../../tokens/USDC.sol";

contract PayoutManagerTest is PayoutManager {
  address stablecoin = address(new USDC(1000000));
  address issuer = address(new Issuer(1,msg.sender, stablecoin, msg.sender,""));
  address asset = address(new Asset(1, msg.sender, issuer, 1000000 ether, false,
    "ETHC", "ETHC", ""
  ));

  constructor() PayoutManager(1, msg.sender, asset, ""){}

    function echidna_test() public pure returns (bool) {
      return true;
    }
}

contract PayoutManagerFactoryTest is PayoutManagerFactory {
    function echidna_test() public pure returns (bool) {
      return true;
    }
}