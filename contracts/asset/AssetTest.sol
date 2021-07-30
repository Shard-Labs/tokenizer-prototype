// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Asset.sol";
import "./AssetFactory.sol";
import "../issuer/Issuer.sol";
import "../tokens/USDC.sol";

contract AssetTest is Asset {
    address stablecoin = address(new USDC(1000000));
    address issuer = address(new Issuer(1,msg.sender, stablecoin, msg.sender,""));

    constructor() Asset(1,
        msg.sender,
        issuer,
        1000000 ether,
        false,
        "ETHC",
        "ETHC",
        ""){}

    function echidna_test() public pure returns (bool) {
      return true;
    }
}

contract AssetFactoryTest is AssetFactory {
    function echidna_test() public pure returns (bool) {
      return true;
    }
}