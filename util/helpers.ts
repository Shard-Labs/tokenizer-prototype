import { ethers } from "hardhat";
import { Contract, Signer, BigNumber } from "ethers";
import * as filters from "./filters";

export async function deployStablecoin(deployer: Signer, supply: string): Promise<Contract> {
  const supplyWei = ethers.utils.parseEther(supply);
  const USDC = await ethers.getContractFactory("USDC", deployer);
  const stablecoin = await USDC.deploy(supplyWei);
  console.log(`\nStablecoin deployed\n\tAt address: ${stablecoin.address}`);
  return stablecoin;
}

export async function deployFactories(deployer: Signer): Promise<Contract[]> {
  return [
    await deployIssuerFactory(deployer),
    await deployAssetFactory(deployer),
    await deployCfManagerFactory(deployer),
    await deployPayoutManagerFactory(deployer)
  ];
}

export async function deployServices(deployer: Signer, masterWalletApprover: string, rewardPerApprove: string): Promise<Contract[]> {
  return [
    await deployWalletApproverService(deployer, masterWalletApprover, rewardPerApprove),
    await deployDeployerService(deployer)
  ];
}

export async function deployWalletApproverService(
  deployer: Signer,
  masterWalletApprover: string,
  rewardPerApproval: string
): Promise<Contract> {
  const WalletApproverService = await ethers.getContractFactory("WalletApproverService", deployer);
  const rewardPerApprovalWei = ethers.utils.parseEther(rewardPerApproval);
  const walletApproverService = await WalletApproverService.deploy(
    masterWalletApprover, [ ], rewardPerApprovalWei
  );
  console.log(`\nWallet approver service deployed\n\tAt address: ${walletApproverService.address}\n\tReward per approval: ${rewardPerApproval} ETH`);
  return walletApproverService;
}

export async function deployDeployerService(deployer: Signer): Promise<Contract> {
  const DeployerService = await ethers.getContractFactory("DeployerService", deployer);
  const deployerService = await DeployerService.deploy();
  console.log(`\nDeployer service deployed\n\tAt address: ${deployerService.address}`);
  return deployerService;
}

export async function deployIssuerFactory(deployer: Signer): Promise<Contract> {
  const IssuerFactory = await ethers.getContractFactory("IssuerFactory", deployer);
  const issuerFactory = await IssuerFactory.deploy();
  console.log(`\nIssuerFactory deployed\n\tAt address: ${issuerFactory.address}`);
  return issuerFactory;
}

export async function deployAssetFactory(deployer: Signer): Promise<Contract> {
  const AssetFactory = await ethers.getContractFactory("AssetFactory", deployer);
  const assetFactory = await AssetFactory.deploy();
  console.log(`\nAssetFactory deployed\n\tAt address: ${assetFactory.address}`);
  return assetFactory;
}

export async function deployCfManagerFactory(deployer: Signer): Promise<Contract> {
  const CfManagerFactory = await ethers.getContractFactory("CfManagerSoftcapFactory", deployer);
  const cfManagerFactory = await CfManagerFactory.deploy();
  console.log(`\nCfManagerFactory deployed\n\tAt address: ${cfManagerFactory.address}`);
  return cfManagerFactory;
}

export async function deployPayoutManagerFactory(deployer: Signer): Promise<Contract> {
  const PayoutManagerFactory = await ethers.getContractFactory("PayoutManagerFactory", deployer);
  const payoutManagerFactory = await PayoutManagerFactory.deploy();
  console.log(`\nPayoutManagerFactory deployed\n\tAt address: ${payoutManagerFactory.address}`);
  return payoutManagerFactory;
}

export async function createIssuerAssetCampaign(
  issuerOwner: String,
  issuerStablecoin: String,
  issuerWalletApprover: String,
  issuerInfo: String,
  assetOwner: String,
  assetInitialTokenSupply: Number,
  assetWhitelistRequired: boolean,
  assetName: String,
  assetSymbol: String,
  assetInfo: String,
  cfManagerOwner: String,
  cfManagerPricePerToken: Number,
  cfManagerSoftcap: Number,
  cfManagerMinInvestment: Number,
  cfManagerMaxInvestment: Number,
  cfManagerTokensToSellAmount: Number,
  cfManagerWhitelistRequired: boolean,
  cfManagerInfo: String,
  issuerFactory: Contract,
  assetFactory: Contract,
  cfManagerFactory: Contract,
  deployerService: Contract
): Promise<Array<Contract>> {
  const assetInitialTokenSupplyWei = ethers.utils.parseEther(assetInitialTokenSupply.toString());
  const cfManagerSoftcapWei = ethers.utils.parseEther(cfManagerSoftcap.toString());
  const cfManagerTokensToSellAmountWei = ethers.utils.parseEther(cfManagerTokensToSellAmount.toString());
  const cfManagerMinInvestmentWei = ethers.utils.parseEther(cfManagerMinInvestment.toString());
  const cfManagerMaxInvestmentWei = ethers.utils.parseEther(cfManagerMaxInvestment.toString());
  const deployTx = await deployerService.deployIssuerAssetCampaign(
    [
      issuerFactory.address,
      assetFactory.address,
      cfManagerFactory.address,
      issuerOwner,
      issuerStablecoin,
      issuerWalletApprover,
      issuerInfo,
      assetOwner,
      assetInitialTokenSupplyWei,
      assetWhitelistRequired,
      assetName,
      assetSymbol,
      assetInfo,
      cfManagerOwner,
      cfManagerPricePerToken,
      cfManagerSoftcapWei,
      cfManagerMinInvestmentWei,
      cfManagerMaxInvestmentWei,
      cfManagerTokensToSellAmountWei,
      cfManagerWhitelistRequired,
      cfManagerInfo
    ]
  );
  const receipt = await ethers.provider.waitForTransaction(deployTx.hash);
  
  let issuerAddress: string;
  let assetAddress: string;
  let cfManagerAddress: string;
  for (const log of receipt.logs) {
    try {
      const parsedLog = issuerFactory.interface.parseLog(log);
      if (parsedLog.name == "IssuerCreated") {
        const ownerAddress = parsedLog.args.creator;
        const id = parsedLog.args.id;
        issuerAddress = parsedLog.args.issuer;
        console.log(`\nIssuer deployed\n\tAt address: ${issuerAddress}\n\tOwner: ${ownerAddress}\n\tID: ${id}`);
      }
    } catch (_) {}

    try {
      const parsedLog = assetFactory.interface.parseLog(log);
      if (parsedLog.name == "AssetCreated") {
        const ownerAddress = parsedLog.args.creator;
        const id = parsedLog.args.id;
        assetAddress = parsedLog.args.asset;
        console.log(`\nAsset deployed\n\tAt address: ${assetAddress}\n\tOwner: ${ownerAddress}\n\tID: ${id}`);
      }
    } catch (_) {}

    try {
      const parsedLog = cfManagerFactory.interface.parseLog(log);
      if (parsedLog.name == "CfManagerSoftcapCreated") {
        const ownerAddress = parsedLog.args.creator;
        const assetAddress = parsedLog.args.asset;
        const id = parsedLog.args.id;
        cfManagerAddress = parsedLog.args.cfManager;
        console.log(`\nCrowdfunding Campaign deployed\n\tAt address: ${cfManagerAddress}\n\tOwner: ${ownerAddress}\n\tAsset: ${assetAddress}\n\tID: ${id}`);
      }
    } catch (_) {}
  }
  const issuer = await ethers.getContractAt("Issuer", issuerAddress);
  const asset = await ethers.getContractAt("Asset", assetAddress);
  const campaign = await ethers.getContractAt("CfManagerSoftcap", cfManagerAddress);

  return [issuer, asset, campaign];
}

export async function createAssetCampaign(
  issuer: Contract,
  assetOwner: String,
  assetInitialTokenSupply: Number,
  assetWhitelistRequired: boolean,
  assetName: String,
  assetSymbol: String,
  assetInfo: String,
  cfManagerOwner: String,
  cfManagerPricePerToken: Number,
  cfManagerSoftcap: Number,
  cfManagerMinInvestment: Number,
  cfManagerMaxInvestment: Number,
  cfManagerTokensToSellAmount: Number,
  cfManagerWhitelistRequired: boolean,
  cfManagerInfo: String,
  assetFactory: Contract,
  cfManagerFactory: Contract,
  deployerService: Contract
): Promise<Array<Contract>> {
  const assetInitialTokenSupplyWei = ethers.utils.parseEther(assetInitialTokenSupply.toString());
  const cfManagerSoftcapWei = ethers.utils.parseEther(cfManagerSoftcap.toString());
  const cfManagerMinInvestmentWei = ethers.utils.parseEther(cfManagerMinInvestment.toString());
  const cfManagerMaxInvestmentWei = ethers.utils.parseEther(cfManagerMaxInvestment.toString());
  const cfManagerTokensToSellAmountWei = ethers.utils.parseEther(cfManagerTokensToSellAmount.toString());
  const deployTx = await deployerService.deployAssetCampaign(
    [
      assetFactory.address,
      cfManagerFactory.address,
      issuer.address,
      assetOwner,
      assetInitialTokenSupplyWei,
      assetWhitelistRequired,
      assetName,
      assetSymbol,
      assetInfo,
      cfManagerOwner,
      cfManagerPricePerToken,
      cfManagerSoftcapWei,
      cfManagerMinInvestmentWei,
      cfManagerMaxInvestmentWei,
      cfManagerTokensToSellAmountWei,
      cfManagerWhitelistRequired,
      cfManagerInfo
    ]
  );
  const receipt = await ethers.provider.waitForTransaction(deployTx.hash);

  let assetAddress: string;
  let cfManagerAddress: string;
  for (const log of receipt.logs) {
    try {
      const parsedLog = assetFactory.interface.parseLog(log);
      if (parsedLog.name == "AssetCreated") {
        const ownerAddress = parsedLog.args.creator;
        const id = parsedLog.args.id;
        assetAddress = parsedLog.args.asset;
        console.log(`\nAsset deployed\n\tAt address: ${assetAddress}\n\tOwner: ${ownerAddress}\n\tID: ${id}`);
      }
    } catch (_) {}

    try {
      const parsedLog = cfManagerFactory.interface.parseLog(log);
      if (parsedLog.name == "CfManagerSoftcapCreated") {
        const ownerAddress = parsedLog.args.creator;
        const assetAddress = parsedLog.args.asset;
        const id = parsedLog.args.id;
        cfManagerAddress = parsedLog.args.cfManager;
        console.log(`\nCrowdfunding Campaign deployed\n\tAt address: ${cfManagerAddress}\n\tOwner: ${ownerAddress}\n\tAsset: ${assetAddress}\n\tID: ${id}`);
      }
    } catch (_) {}
  }
  const asset = await ethers.getContractAt("Asset", assetAddress);
  const campaign = await ethers.getContractAt("CfManagerSoftcap", cfManagerAddress);

  return [asset, campaign];
}

/**
 * Creates the issuer instance.
 * Issuer has to be created before any of the assets or crowdfunding campaigns was created.
 * One investment platform instance (one domain) is mapped to one Issuer instance.
 * This is where the whitelisted addresses are stored. Issuer also holds the address of the
 * stablecoin to be accepted for the investments and revenue share payouts.
 * 
 * @param from Creator's signer object
 * @param stablecoin Stablecoin contract instance accepted as the payment method for this issuer
 * @param walletApproverAddress Address of the wallet approver (wallet with the rights to whitelist addresses).
 *                              This will be set to our auto-approver-script's wallet if the manager 
 *                              chooses to auto-approve all the wallets with completed kyc.
 * @param info Ipfs hash representing general investment platform instance info (colors, logo url, etc)
 * @param issuerFactory Issuer factory contract (predeployed and sitting at well known address)
 * @returns Contract instance of the deployed issuer, already connected to the owner's signer object
 */
export async function createIssuer(
  owner: String,
  stablecoin: Contract,
  walletApproverAddress: String,
  info: String,
  issuerFactory: Contract
): Promise<Contract> {
  const issuerTx = await issuerFactory.create(
    owner,
    stablecoin.address,
    walletApproverAddress,
    info
  );
  const receipt = await ethers.provider.waitForTransaction(issuerTx.hash);
  for (const log of receipt.logs) {
    const parsedLog = issuerFactory.interface.parseLog(log);
    if (parsedLog.name == "IssuerCreated") {
      const ownerAddress = parsedLog.args.creator;
      const issuerAddress = parsedLog.args.issuer;
      const id = parsedLog.args.id;
      console.log(`\nIssuer deployed\n\tAt address: ${issuerAddress}\n\tOwner: ${ownerAddress}\n\tID: ${id}`);
      return (await ethers.getContractAt("Issuer", issuerAddress));
    }
  }
  throw new Error("Issuer creation transaction failed.");
}

/**
 * Creates an Asset which is basically an ERC-20 token with the possibility 
 * of taking snapshots to support revenue distribution functionality.
 * An asset has to be created before the crowdfunding campaign with the predefined token supply.
 * The whole supply is automatically owned by the token creator.
 * 
 * @param from Creator's signer object
 * @param issuer Asset's issuer contract instance
 * @param initialTokenSupply Total number of tokens to be created. Not changeable afterwards.
 * @param whitelistRequiredForTransfer If set to true, tokens will be transferable only between the whitelisted addresses 
 * @param name Asset token name (For example APPLE INC.) 
 * @param symbol Asset token symbol/ticker (For example APPL)
 * @param info Asset info ipfs hash providing more than just a name and the ticker (if necessary)
 * @param assetFactory Asset factory contract (predeployed and sitting at well known address)
 * @returns Contract instance of the deployed asset token, already connected to the owner's signer object
 */
export async function createAsset(
  owner: String,
  issuer: Contract,
  initialTokenSupply: Number,
  whitelistRequiredForTransfer: boolean,
  name: String,
  symbol: String,
  info: String,
  assetFactory: Contract
): Promise<Contract> {
  const createAssetTx = await assetFactory.create(
    owner,
    issuer.address,
    ethers.utils.parseEther(initialTokenSupply.toString()),
    whitelistRequiredForTransfer,
    name,
    symbol,
    info
  );
  const receipt = await ethers.provider.waitForTransaction(createAssetTx.hash);
  for (const log of receipt.logs) {
    try {
      const parsedLog = assetFactory.interface.parseLog(log);
      if (parsedLog.name == "AssetCreated") {
        const ownerAddress = parsedLog.args.creator;
        const assetAddress = parsedLog.args.asset;
        const id = parsedLog.args.id;
        console.log(`\nAsset deployed\n\tAt address: ${assetAddress}\n\tOwner: ${ownerAddress}\n\tID: ${id}`);
        return (await ethers.getContractAt("Asset", assetAddress));
      }
    } catch (_) {}
  }
  throw new Error("Asset creation transaction failed.");
}

/**
 * Creates the crowdfunding campaign contract.
 * For the crowdfunding campaign to be considered active, the creator has to transfer tokens
 * to be sold to the address of this contract, and then call the approveCampaign() function on the
 * Issuer contract.
 * 
 * @param from Creator's signer object
 * @param asset Asset contract instance whose tokens are to be sold through this crowdfunding campaign
 * @param initialPricePerToken Price per token (in stablecoin) 
 * @param softCap Minimum funds to be raised (in stablecoin) for the campaigng to succeed
 * @param whitelistRequired Set to true to allow only whitelisted (kyc) wallets to invest.
 * @param info Campaign info ipfs hash describing this campaign.
 * @param cfManagerFactory CfManager factory contract (predeployed and sitting at well known address)
 * @returns Contract instance of the deployed crowdfunding manager, already connected to the owner's signer object
 */
export async function createCfManager(
  owner: String,
  asset: Contract,
  pricePerToken: Number,
  softCap: Number,
  minInvestment: Number,
  maxInvestment: Number,
  whitelistRequired: boolean,
  info: String,
  cfManagerFactory: Contract
): Promise<Contract> {
  const cfManagerTx = await cfManagerFactory.create(
    owner,
    asset.address,
    pricePerToken,
    ethers.utils.parseEther(softCap.toString()),
    ethers.utils.parseEther(minInvestment.toString()),
    ethers.utils.parseEther(maxInvestment.toString()),
    whitelistRequired,
    info
  );
  const receipt = await ethers.provider.waitForTransaction(cfManagerTx.hash);
  for (const log of receipt.logs) {
    const parsedLog = cfManagerFactory.interface.parseLog(log);
    if (parsedLog.name == "CfManagerSoftcapCreated") {
      const ownerAddress = parsedLog.args.creator;
      const cfManagerAddress = parsedLog.args.cfManager;
      const assetAddress = parsedLog.args.asset;
      const id = parsedLog.args.id;
      console.log(`\nCrowdfunding Campaign deployed\n\tAt address: ${cfManagerAddress}\n\tOwner: ${ownerAddress}\n\tAsset: ${assetAddress}\n\tID: ${id}`);
      return (await ethers.getContractAt("CfManagerSoftcap", cfManagerAddress));
    }
  }
  throw new Error("Crowdfunding Campaign creation transaction failed.");
}

/**
 * Creates payout manager to be used later for distributing revenue to the token holders.
 * 
 * @param from Revenue distributor signer object
 * @param asset Asset contract instance whose token holders are to receive payments
 * @param info Payout manager info ipfs-hash
 * @param payoutManagerFactory PayoutManager factory contract (predeployed and sitting at well known address)
 * @returns Contract instance of the deployed payout manager, already connected to the owner's signer object 
 */
export async function createPayoutManager(
  owner: String,
  asset: Contract,
  info: String,
  payoutManagerFactory: Contract
 ): Promise<Contract> {
  const payoutManagerTx = await payoutManagerFactory.create(owner, asset.address, info);
  const receipt = await ethers.provider.waitForTransaction(payoutManagerTx.hash);
  for (const log of receipt.logs) {
    const parsedLog = payoutManagerFactory.interface.parseLog(log);
    if (parsedLog.name == "PayoutManagerCreated") {
      const owner = parsedLog.args.creator;
      const payoutManagerAddress = parsedLog.args.payoutManager;
      const assetAddress = parsedLog.args.asset;
      const id = parsedLog.args.id;
      console.log(`\nPayoutManager deployed\n\tAt address: ${payoutManagerAddress}\n\tFor Asset: ${assetAddress}\n\tOwner: ${owner}\n\tID: ${id}`);
      return ethers.getContractAt("PayoutManager", payoutManagerAddress);
    }
  }
  throw new Error("PayoutManager creation transaction failed.");
}

/**
 * Invests some amount of the stablecoin.
 * The stablecoin to be used was fetched earlier by reading the asset's issuer configuration.
 * 
 * Two transactions involved here:
 *  1) Approve CfManager to spend your funds
 *  2) Call the invest() function on the CfManager
 * 
 * @param investor Investor signer object
 * @param cfManager CfManager contract instance
 * @param stablecoin Stablecoin contract instance to be used for payment
 * @param amount Amount of the stablecoin to be invested
 */
export async function invest(investor: Signer, cfManager: Contract, stablecoin: Contract, amount: Number) {
  const amountWei = ethers.utils.parseEther(amount.toString());
  await stablecoin.connect(investor).approve(cfManager.address, amountWei);
  await cfManager.connect(investor).invest(amountWei);
}

/**
 * Will cancel the full amount invested in the project. Transaction will return
 * all of the invested funds to the investor's wallet. Can only be called by the
 * investor who has placed an investment in the campaign, and the campaign was not yet
 * finalized.
 * 
 * @param investor Investor signer object
 * @param cfManager CfManager contract instance
 */
export async function cancelInvest(investor: Signer, cfManager: Contract) {
  await cfManager.connect(investor).cancelInvestment();
}

/**
 * Transfers claimable tokens to the investors wallet.
 * Can only be called if the investor has actually invested in the campaign
 * and only after the campaign owner has finalized the campaign.
 * 
 * @param investor Investor signer object
 * @param cfManager CfManager contract instance
 */
export async function claimInvestment(investor: Signer, cfManager: Contract) {
  const investorAddress = await investor.getAddress();
  await cfManager.connect(investor).claim(investorAddress);
}

/**
 * Finalizes active crowdfunding campaign.
 * Can only be called by the campaign owner if the soft cap has been reached.
 * This transaction will transfer all of the funds raised to the owner's wallet.
 * If some of the tokens were not sold they are also returned to the owner's wallet
 * in the same transaction. 
 * 
 * @param owner CfManager owner signer object
 * @param cfManager CfManager contract instance
 */
export async function finalizeCampaign(owner: Signer, cfManager: Contract) {
  await cfManager.connect(owner).finalize();
}

/**
 * Cancels active crowdfunding campaign.
 * Can only be cancelled by the campaign owner, if it was not finalized before.
 * 
 * @param owner CfManager contract owner signer object
 * @param cfManager CfManager contract instance
 */
export async function cancelCampaign(owner: Signer, cfManager: Contract) {
  await cfManager.connect(owner).cancelCampaign();
}

/**
 * Distributes revenue to the token holders, proportional to the amount of the tokens 
 * owned at the moment of the execution of this transaction. If the token ownership structure changes
 * after this transaction has been processed, it will not impact the distribution because the ownership
 * structure snapshot has been made when the revenue was distributed.
 * 
 * Revenue distribution goes through the PayoutManager contract, created by the PayoutManagerFactory.
 * One payout manager can be used for multiple payouts (say yearly shareholder dividend payout).
 * 
 * If the PayoutManager contract exists, the actual payout process is made of two steps:
 *  1) approve the payout manager contract to spend revenue amount (in stablecoin)
 *  2) call the createPayout() function on the PayoutManager contract
 * 
 * createPayout() function will take the snapshot of the token holders structure and distribute revenue accordingly.
 * createPayout() function also takes the payment description as parameter, if there is any info to be provided for 
 *                the payment batch (for example "WindFarm Q3/2021 revenue")
 * 
 * @param owner Payment creator signer object
 * @param payoutManager PayoutManager contract instance used for handling the payouts. Has to be created before calling this function.
 * @param stablecoin Stablecoin contract instance to be used as the payment method
 * @param amount Amount (in stablecoin) to be distributed as revenue
 * @param payoutDescription Description for this revenue payout
 */
export async function createPayout(owner: Signer, payoutManager: Contract, stablecoin: Contract, amount: Number, payoutDescription: String) {
  const amountWei = ethers.utils.parseEther(amount.toString());
  await stablecoin.connect(owner).approve(payoutManager.address, amountWei);
  await payoutManager.connect(owner).createPayout(payoutDescription, amountWei);
}

/**
 * Claims revenue for given investor, PayoutManager contract and payoutId.
 * PayoutId is important since one PayoutManager contract can handle multiple
 * payouts (say yearly dividend payout). Every time new revenue is transferred to the
 * manager contract -> new payout is created with id being an auto increment (starts from 1).
 * 
 * @param investor Investor signer object
 * @param payoutManager Contract instance handling payouts for one Asset
 * @param payoutId Id of the payout
 */
export async function claimRevenue(investor: Signer, payoutManager: Contract, payoutId: Number) {
  const investorAddress = await investor.getAddress();
  await payoutManager.connect(investor).release(investorAddress, payoutId);
}

/**
 * Will update info hash on the target object.
 * Can only be called by the contract owner.
 * 
 * @param owner Contract owner signer object
 * @param contract Must be one of: Issuer, CfManager, Asset, PayoutManager
 */
export async function setInfo(owner: Signer, contract: Contract, infoHash: String) {
  await contract.connect(owner).setInfo(infoHash);
}

/**
 * Query contract for complete edit history.
 * Every new info update is a new hash stored in the contract state together with the timestamp.
 * 
 * @param contract Must be one of: Issuer, CfManager, Asset, PayoutManager
 * @returns Returns array of all the info strings (with timestamps) with the last one being the active info hash.
 */
export async function getInfoHistory(contract: Contract): Promise<Object> {
  return contract.getInfoHistory();
}

/**
 * 
 * @param contract Issuer contract instance
 * @returns State object
 * 
 * Example response array (ethersjs):
 * 
 *   [
 *    id: BigNumber { _hex: '0x00', _isBigNumber: true },
 *    owner: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
 *    stablecoin: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
 *    walletApprover: '0x976EA74026E726554dB657fA54763abd0C3a0aa9',
 *    info: 'updated-issuer-info-ipfs-hash'
 *   ]
 */
export async function getIssuerState(contract: Contract): Promise<String> {
  return contract.getState();
}

/**
 * 
 * @param contract Asset contract instance
 * @returns State object
 * 
 * Example response array (ethersjs):
 * 
 *  [
 *   id: BigNumber { _hex: '0x00', _isBigNumber: true },
 *   owner: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
 *   mirroredToken: '0x0000000000000000000000000000000000000000',
 *   initialTokenSupply: BigNumber { _hex: '0xd3c21bcecceda1000000', _isBigNumber: true },
 *   whitelistRequiredForTransfer: true,
 *   issuer: '0xCafac3dD18aC6c6e92c921884f9E4176737C052c',
 *   info: 'updated-asset-info-hash',
 *   name: 'Test Asset',
 *   symbol: 'TSTA'
 *  ]
 * 
 */
export async function getAssetState(contract: Contract): Promise<Object> {
  return contract.getState();
}

/**
 * 
 * @param contract CfManager contract instance
 * @returns State object
 * 
 * Example response array (ethersjs):
 * 
 *   [
 *    id: BigNumber { _hex: '0x00', _isBigNumber: true },
 *    owner: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
 *    asset: '0x75537828f2ce51be7289709686A69CbFDbB714F1',
 *    tokenPrice: BigNumber { _hex: '0x2710', _isBigNumber: true },
 *    softCap: BigNumber { _hex: '0x54b40b1f852bda000000', _isBigNumber: true },
 *    whitelistRequired: true,
 *    finalized: true,
 *    cancelled: false,
 *    totalClaimableTokens: BigNumber { _hex: '0x54b40b1f852bda000000', _isBigNumber: true },
 *    totalInvestorsCount: BigNumber { _hex: '0x01', _isBigNumber: true },
 *    totalClaimsCount: BigNumber { _hex: '0x01', _isBigNumber: true },
 *    totalFundsRaised: BigNumber { _hex: '0x58f03ee118a13e800000', _isBigNumber: true },
 *    info: 'updated-campaign-info-hash'
 *   ]
 */
export async function getCrowdfundingCampaignState(contract: Contract): Promise<Object> {
  return contract.getState();
}

/**
 * 
 * @param contract PayoutManager contract instance
 * @returns State object
 * 
 * Example response array (ethersjs):
 * 
 *   [
 *    id: BigNumber { _hex: '0x00', _isBigNumber: true },
 *    owner: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
 *    asset: '0x75537828f2ce51be7289709686A69CbFDbB714F1',
 *    info: 'updated-payout-manager-info-hash'
 *   ]
 */
export async function getPayoutManagerState(contract: Contract): Promise<Object> {
  return contract.getState();
}

/**
 * @param issuerFactory Predeployed Issuer factory instance
 * @returns Array of issuer states
 */
export async function fetchIssuerInstances(issuerFactory: Contract): Promise<Object> {
  const instances = await issuerFactory.getInstances();
  const mappedInstances = await Promise.all(instances.map(async (instanceAddress: string) => {
    const instance = await ethers.getContractAt("Issuer", instanceAddress);
    return instance.getState();
  }));
  return mappedInstances;
}

/**
 * @param assetFactory Predeployed Asset factory instance
 * @returns Array of asset states
 */
export async function fetchAssetInstances(assetFactory: Contract): Promise<Object> {
  const instances = await assetFactory.getInstances();
  const mappedInstances = await Promise.all(instances.map(async (instanceAddress: string) => {
    const instance = await ethers.getContractAt("Asset", instanceAddress);
    return instance.getState();
  }));
  return mappedInstances;
}

/**
 * @param assetFactory Predeployed Asset factory instance
 * @param issuer Filter assets by this issuer
 * @returns Array of asset states
 */
export async function fetchAssetInstancesForIssuer(assetFactory: Contract, issuer: Contract): Promise<Object> {
  const instances = await assetFactory.getInstancesForIssuer(issuer.address);
  const mappedInstances = await Promise.all(instances.map(async (instanceAddress: string) => {
    const instance = await ethers.getContractAt("Asset", instanceAddress);
    return instance.getState();
  }));
  return mappedInstances;
}

/**
 * @param cfManagerFactory Predeployed CfManager factory instance
 * @returns Array of crowdfunding campaign states
 */
export async function fetchCrowdfundingInstances(cfManagerFactory: Contract): Promise<Object> {
  const instances = await cfManagerFactory.getInstances();
  const mappedInstances = await Promise.all(instances.map(async (instanceAddress: string) => {
    const instance = await ethers.getContractAt("CfManagerSoftcap", instanceAddress);
    return instance.getState();
  }));
  return mappedInstances;
}

/**
 * @param cfManagerFactory Predeployed CfManager factory instance
 * @param issuer Filter campaigns by this issuer
 * @returns Array of crowdfunding campaign states
 */
export async function fetchCrowdfundingInstancesForIssuer(cfManagerFactory: Contract, issuer: Contract): Promise<Object> {
  const instances = await cfManagerFactory.getInstancesForIssuer(issuer.address);
  const mappedInstances = await Promise.all(instances.map(async (instanceAddress: string) => {
    const instance = await ethers.getContractAt("CfManagerSoftcap", instanceAddress);
    return instance.getState();
  }));
  return mappedInstances;
}

/**
 * @param cfManagerFactory Predeployed CfManager factory instance
 * @param asset Filter campaigns by this asset
 * @returns Array of crowdfunding campaign states
 */
export async function fetchCrowdfundingInstancesForAsset(cfManagerFactory: Contract, asset: Contract): Promise<Object> {
  const instances = await cfManagerFactory.getInstancesForAsset(asset.address);
  const mappedInstances = await Promise.all(instances.map(async (instanceAddress: string) => {
    const instance = await ethers.getContractAt("CfManagerSoftcap", instanceAddress);
    return instance.getState();
  }));
  return mappedInstances;
}

/**
 * @param payoutManagerFactory Predeployed PayoutManager factory instance
 * @returns Array of payout manager states
 */
export async function fetchPayoutManagerInstances(payoutManagerFactory: Contract): Promise<Object> {
  const instances = await payoutManagerFactory.getInstances();
  const mappedInstances = await Promise.all(instances.map(async (instanceAddress: string) => {
    const instance = await ethers.getContractAt("PayoutManager", instanceAddress);
    return instance.getState();
  }));
  return mappedInstances;
}

/**
 * @param payoutManagerFactory Predeployed PayoutManager factory instance
 * @param issuer Filter payout managers by this issuer
 * @returns Array of payout manager states
 */
export async function fetchPayoutManagerInstancesForIssuer(payoutManagerFactory: Contract, issuer: Contract): Promise<Object> {
  const instances = await payoutManagerFactory.getInstancesForIssuer(issuer.address);
  const mappedInstances = await Promise.all(instances.map(async (instanceAddress: string) => {
    const instance = await ethers.getContractAt("PayoutManager", instanceAddress);
    return instance.getState();
  }));
  return mappedInstances;
}

/**
 * @param payoutManagerFactory Predeployed PayoutManager factory instance 
 * @param asset Filter payout managers by this asset
 * @returns Array of payout manager states
 */
export async function fetchPayoutManagerInstancesForAsset(payoutManagerFactory: Contract, asset: Contract): Promise<Object> {
  const instances = await payoutManagerFactory.getInstancesForAsset(asset.address);
  const mappedInstances = await Promise.all(instances.map(async (instanceAddress: string) => {
    const instance = await ethers.getContractAt("PayoutManager", instanceAddress);
    return instance.getState();
  }));
  return mappedInstances;
}

/**
 * @param issuerFactory Predeployed Issuer factory instance
 * @param id Issuer id
 * @returns issuer state
 */
export async function fetchIssuerStateById(issuerFactory: Contract, id: Number): Promise<Object> {
  const instanceAddress = await issuerFactory.instances(id);
  const instance = await ethers.getContractAt("Issuer", instanceAddress);
  return instance.getState();
}

/**
 * @param cfManagerFactory Predeployed CfManager factory instance
 * @param id Crowdfunding campaign id
 * @returns Crowdfunding campaign state
 */
export async function fetchCampaignStateById(cfManagerFactory: Contract, id: Number): Promise<Object> {
  const instanceAddress = await cfManagerFactory.instances(id);
  const instance = await ethers.getContractAt("CfManagerSoftcap", instanceAddress);
  return instance.getState();
}

/**
 * @param assetFactory Predeployed Asset factory instance
 * @param id Asset id
 * @returns Asset state
 */
export async function fetchAssetStateById(assetFactory: Contract, id: Number): Promise<Object> {
  const instanceAddress = await assetFactory.instances(id);
  const instance = await ethers.getContractAt("Asset", instanceAddress);
  return instance.getState();
}

/**
 * @param payoutManagerFactory Predeployed PayoutManager factory
 * @param id PayoutManager id
 * @returns PayoutManager state 
 */
export async function fetchPayoutManagerStateById(payoutManagerFactory: Contract, id: Number): Promise<Object> {
  const instanceAddress = await payoutManagerFactory.instances(id);
  const instance = await ethers.getContractAt("PayoutManager", instanceAddress);
  return instance.getState();
}

/**
 * Fetches transaction history for given user wallet and issuer instance.
 * To calculate this, one must fetch all the instances of the following contracts for given issuer: 
 * -> Asset (for asset token transfers, if any)
 * -> CfManagerSoftcap (for investment, cancel investment and claim tokens transactions)
 * -> PayoutManager (for revenue share claim transactions)
 * Then after all the contract instances have been fetched, we scan for specific events and filter
 * by the user's wallet.
 * 
 * @param wallet User wallet address
 * @param issuer Issuer contract instance
 * @param cfManagerFactory Predeployed CfManager contract factory
 * @param assetFactory Predeployed Asset contract factory
 * @param payoutManagerFactory Predeployed PayoutManager contract factory
 */
export async function fetchTxHistory(
  wallet: string,
  issuer: Contract,
  cfManagerFactory: Contract,
  assetFactory: Contract,
  payoutManagerFactory: Contract
) {
  const assetTransactions = await filters.getAssetTransactions(wallet, issuer, assetFactory);;
  const crowdfundingTransactions = await filters.getCrowdfundingCampaignTransactions(wallet, issuer, cfManagerFactory);
  const payoutManagerTransactions = await filters.getPayoutManagerTransactions(wallet, issuer, payoutManagerFactory);
  const transactions = assetTransactions.concat(crowdfundingTransactions).concat(payoutManagerTransactions);
  return transactions.sort((a, b) => (a.timestamp < b.timestamp) ? -1 : 1);
}

/**
 * @param issuer Issuer contract instance
 * @returns Array of issuer wallet records
 * 
 * Example response array (ethers.js)
 * 
 *   [
 *     [
 *       wallet: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
 *       whitelisted: true
 *     ],
 *     [
 *       wallet: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
 *       whitelisted: true
 *     ]
 *   ]
 */
export async function fetchWalletRecords(issuer: Contract): Promise<Array<Object>> {
  return issuer.getWalletRecords();
}

/**
 * @param issuer Issuer contract instance
 * @returns Array of issuer campaign records
 */
export async function fetchCampaignRecords(asset: Contract): Promise<Array<Object>> {
  return asset.getCampaignRecords();
}
