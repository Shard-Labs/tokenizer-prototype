import { ethers } from "hardhat";
import { Contract, ContractFactory, Signer } from "ethers";
import { AssetState } from "../util/types";

const factories: Map<String, ContractFactory> = new Map();

export async function deployStablecoin(deployer: Signer, supply: string): Promise<Contract> {
  const supplyWei = ethers.utils.parseEther(supply);
  const USDC = await ethers.getContractFactory("USDC", deployer);
  const stablecoin = await USDC.deploy(supplyWei);
  console.log(`Stablecoin deployed at: ${stablecoin.address}`);
  factories[stablecoin.address] = USDC.interface;
  return stablecoin;
}

export async function deployGlobalRegistry(deployer: Signer): Promise<Contract> {
  const GlobalRegistry = await ethers.getContractFactory("GlobalRegistry", deployer);
  
  const IssuerFactory = await ethers.getContractFactory("IssuerFactory", deployer);
  const AssetFactory = await ethers.getContractFactory("AssetFactory", deployer);
  const CfManagerFactory = await ethers.getContractFactory("CfManagerFactory", deployer);
  const PayoutManagerFactory = await ethers.getContractFactory("PayoutManagerFactory", deployer);

  const issuerFactory = await IssuerFactory.deploy();
  factories[issuerFactory.address] = IssuerFactory;
  console.log(`IssuerFactory deployed at: ${issuerFactory.address}`);

  const assetFactory = await AssetFactory.deploy();
  factories[assetFactory.address] = AssetFactory;
  console.log(`AssetFactory deployed at: ${assetFactory.address}`);

  const cfManagerFactory = await CfManagerFactory.deploy();
  factories[cfManagerFactory.address] = CfManagerFactory;
  console.log(`CfManagerFactory deployed at: ${cfManagerFactory.address}`);

  const payoutManagerFactory = await PayoutManagerFactory.deploy();
  factories[payoutManagerFactory.address] = PayoutManagerFactory;
  console.log(`PayoutManagerFactory deployed at: ${payoutManagerFactory.address}`);

  const registry = await GlobalRegistry.deploy(
    issuerFactory.address,
    assetFactory.address,
    cfManagerFactory.address,
    payoutManagerFactory.address
  );
  console.log(`Global Registry deployed at: ${registry.address}`);
  return registry;
}

export async function createIssuer(
  from: Signer,
  registry: Contract,
  stablecoinAddress: String,
  walletApproverAddress: String,
  info: String
) {
  const fromAddress = await from.getAddress();
  const issuerFactory = (await ethers.getContractAt("IssuerFactory", "0xF9ddA99dFD9bC285815D057C4dDf05B4275e22C1")).connect(from);
  const issuerTx = await issuerFactory.create(
    fromAddress,
    stablecoinAddress,
    registry.address,
    walletApproverAddress,
    info
  );
  console.log("issuerTx", issuerTx);
  // const receipt = await ethers.provider.getTransactionReceipt(issuerTx.hash);
  // for (const log of receipt.logs) {
  //   const parsedLog = issuerFactory.interface.parseLog(log);
  //   if (parsedLog.name == "IssuerCreated") {
  //     const issuerAddress = parsedLog.args[0];
  //     console.log(`Issuer deployed at: ${issuerAddress}; Owner: ${fromAddress}`);
  //     return (await ethers.getContractAt("Issuer", parsedLog.args[0])).connect(from);
  //   }
  // }
  // throw new Error("Issuer creation transaction failed.");
  
}

export async function createCfManager(
  from: Signer,
  issuer: Contract,
  categoryId: Number,
  totalShares: Number,
  name: String,
  symbol: String,
  minInvestment: Number,
  maxInvestment: Number,
  endsAt: Number
): Promise<[Contract, Contract]> {
  const issuerWithSigner = issuer.connect(from);
  const cfManagerTx = await issuerWithSigner.createCrowdfundingCampaign(
    categoryId,
    ethers.utils.parseEther(totalShares.toString()),
    name,
    symbol,
    ethers.utils.parseEther(minInvestment.toString()),
    ethers.utils.parseEther(maxInvestment.toString()),
    endsAt
  );
  const receipt = await ethers.provider.getTransactionReceipt(cfManagerTx.hash);

  let cfManagerAddress;
  let assetAddress;
  for (const log of receipt.logs) {
    const contractFactory = factories[log.address];
    if (contractFactory) {
      const parsedLog = contractFactory.interface.parseLog(log);
      switch (parsedLog.name) {
        case "AssetCreated": { assetAddress = parsedLog.args[0]; break; }
        case "CfManagerCreated": { cfManagerAddress = parsedLog.args[0]; break; }
      }
    }
  }

  const owner = await from.getAddress();
  console.log(`CfManager for Asset ${name} deployed at: ${cfManagerAddress}; Owner: ${owner}`);
  console.log(`Asset ${name} deplyed at: ${assetAddress}; Owner ${owner}`);
  const cfManager = await ethers.getContractAt("CfManager", cfManagerAddress);
  const asset = await ethers.getContractAt("Asset", assetAddress);
  return [cfManager, asset];
}

export async function createAsset(
  from: Signer,
  issuer: Contract,
  categoryId: Number,
  totalShares: Number,
  name: String,
  symbol: String,
): Promise<Contract> {
  const fromAddress = await from.getAddress();
  const createAssetTx = await issuer.connect(from).createAsset(
    categoryId,
    ethers.utils.parseEther(totalShares.toString()),
    AssetState.CREATION,
    name,
    symbol
  );
  const receipt = await ethers.provider.getTransactionReceipt(createAssetTx.hash);
  for (const log of receipt.logs) {
    const contractFactory = factories[log.address];
    if (contractFactory) {
      const parsedLog = contractFactory.interface.parseLog(log);
      if (parsedLog.name == "AssetCreated") {
        const assetAddress = parsedLog.args[0];
        console.log(`Asset ${name} deployed at: ${assetAddress}; Owner: ${fromAddress}`);
        return ethers.getContractAt("Asset", parsedLog.args[0]);
      }
    }
  }
  throw new Error("Asset creation transaction failed.");
}
  
export async function createPayoutManager(
  from: Signer,
  registry: Contract,
  assetAddress: String
 ): Promise<Contract> {
  const fromAddress = await from.getAddress();
  const payoutManagerFactory = (await ethers.getContractAt("PayoutManagerFactory", await registry.payoutManagerFactory())).connect(from);
  const payoutManagerTx = await payoutManagerFactory.create(fromAddress, assetAddress);
  const receipt = await ethers.provider.getTransactionReceipt(payoutManagerTx.hash);
  for (const log of receipt.logs) {
    const parsedLog = payoutManagerFactory.interface.parseLog(log);
    if (parsedLog.name == "PayoutManagerCreated") {
      const payoutManagerAddress = parsedLog.args[0];
      console.log(`PayoutManager deployed at: ${payoutManagerAddress}; For Asset: ${assetAddress}; Owner: ${fromAddress}`);
      return ethers.getContractAt("PayoutManager", parsedLog.args[0]);
    }
  }
  throw new Error("PayoutManager creation transaction failed.");
}

export function currentTimeWithDaysOffset(days) {
  var result = new Date();
  result.setDate(result.getDate() + days);
  return result.getTime();
}

export function currentTimeWithSecondsOffset(seconds) {
  var result = new Date();
  result.setSeconds(result.getSeconds() + seconds);
  return result.getTime();
}
