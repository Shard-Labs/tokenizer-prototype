// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Issuer.sol";
import "./IssuerFactory.sol";
import "../tokens/USDC.sol";

contract IssuerTest is Issuer {
  address stablecoin = address(new USDC(1000000));

  constructor() Issuer(
      1,
      msg.sender,
      stablecoin,
      msg.sender,
      ""){}

    function echidna_test() public pure returns (bool) {
      return true;
    }
}

contract IssuerFactoryTest is IssuerFactory {
    function echidna_test() public pure returns (bool) {
      return true;
    }
}