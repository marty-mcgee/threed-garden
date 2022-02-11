import chai from "chai";
import { ethers } from "hardhat";
import { solidity } from "ethereum-waffle";
import {
  deployToken,
  deployTimelock,
  deployGovernor,
  deployMinter,
  propose,
  hashString,
  advanceBlocks,
  setNextBlockTimestamp,
  createTransferProp,
  deployAndInitDeployer,
  MINTER_ADMIN_ROLE,
  BASE_URI_ADMIN_ROLE,
  MINTER_ROLE,
  BASE_URI_ROLE,
  DEFAULT_ADMIN_ROLE,
  ADMINS_ADMIN_ROLE,
  proposeAndExecute,
  ROYALTIES_ADMIN_ROLE,
  ROYALTIES_ROLE,
  PROXY_REGISTRY_ADMIN_ROLE,
  PROXY_REGISTRY_ROLE,
  cloneContract,
  initToken,
  cloneAndinitContract,
  TRANSFERS_ADMIN_ROLE,
  TRANSFERS_ROLE,
} from "./utils";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  FixedPriceSequentialMinter,
  ERC721DAOToken,
  ERC721Governor,
  ERC721Timelock,
  ERC721Timelock__factory,
  ERC721DAOToken__factory,
  ERC721Governor__factory,
  FixedPriceSequentialMinter__factory,
  FixedPriceSpecificIDMinter__factory,
  FixedPriceSpecificIDMinter,
  RequiredNFTsMintingFilter,
  ERC20Stub__factory,
  ERC20Stub,
} from "../typechain";
import { ERC721DAODeployer } from "../typechain/ERC721DAODeployer";
import { Wallet } from "@ethersproject/wallet";
import { RequiredNFTsMintingFilter__factory } from "../typechain/factories/RequiredNFTsMintingFilter__factory";
import { parseEther } from "@ethersproject/units";
import { ProxyRegistryMock__factory } from "../typechain/factories/ProxyRegistryMock__factory";
import { ProxyRegistryMock } from "../typechain/ProxyRegistryMock";
import { GovernorUpgradeMock__factory } from "../typechain/factories/GovernorUpgradeMock__factory";
import { GovernorUpgradeMock } from "../typechain/GovernorUpgradeMock";
import { TimelockUpgradeMock } from "../typechain/TimelockUpgradeMock";
import { TimelockUpgradeMock__factory } from "../typechain/factories/TimelockUpgradeMock__factory";
import { BigNumber } from "ethers";

chai.use(solidity);
const { expect } = chai;
const zeroAddress = "0x0000000000000000000000000000000000000000";
const SERVICE_FEE_ADDRESS = "0xbeef0000beef0000beef0000beef0000beef0000";

// Token Config
const BASE_URI =
  "ipfs://bafybeif4s7oom2ch6iv42yn7la4b3dnkud2dgujmnhuxuswekx4l6yz4me/";

// Minter Config
const MAX_TOKENS = 10;
const TOKEN_PRICE = parseEther("0.1");
const MAX_MINTS_PER_WALLET = 10;
const STARTING_BLOCK = 1;
const TOTAL_SHARES = 10000;
const FOUNDER_REWARD = 0.05;
const FEE_BASIS_POINTS = 250;
const FOUNDER_SHARES = FOUNDER_REWARD * TOTAL_SHARES;
const DAO_SHARES = TOTAL_SHARES - FOUNDER_SHARES;

// Governance Config
const PROP_THRESHOLD = 1;
const QUORUM_NUMERATOR = 1; // 1%
const VOTING_PERIOD = 5_760; // About 24 hours with 15s blocks
const VOTING_DELAY = 1; // 1 block
const TIMELOCK_DELAY = 172_800; // 2 days

let signer: SignerWithAddress;
let user1: SignerWithAddress;
let user2: SignerWithAddress;
let user3: SignerWithAddress;
let user4: SignerWithAddress;
let rando: SignerWithAddress;
let creator: Wallet;

let tokenImpl: ERC721DAOToken;
let timelockImpl: ERC721Timelock;
let governorImpl: ERC721Governor;
let simpleMinterImpl: FixedPriceSequentialMinter;
let idMinterImpl: FixedPriceSpecificIDMinter;
let requiredNFTFilterImpl: RequiredNFTsMintingFilter;

let token: ERC721DAOToken;
let timelock: ERC721Timelock;
let governor: ERC721Governor;
let simpleMinter: FixedPriceSequentialMinter;
let idMinter: FixedPriceSpecificIDMinter;
let deployer: ERC721DAODeployer;
let requiredToken: ERC721DAOToken;
let mockProxyRegistry: ProxyRegistryMock;

const deployMockProxyRegistry = async () => {
  mockProxyRegistry = await new ProxyRegistryMock__factory(signer).deploy();
};

const deploy = async () => {
  [signer, user1, user2, user3, user4, rando] = await ethers.getSigners();

  creator = new Wallet(Wallet.createRandom().privateKey, signer.provider);

  const giveCreatorEth = {
    to: creator.address,
    value: parseEther("50"),
  };
  await user1.sendTransaction(giveCreatorEth);

  // Deploy logic contracts
  tokenImpl = await deployToken(signer);
  timelockImpl = await deployTimelock(signer);
  governorImpl = await deployGovernor(signer);
  simpleMinterImpl = await deployMinter(signer);
  idMinterImpl = await new FixedPriceSpecificIDMinter__factory(signer).deploy();
  requiredNFTFilterImpl = await new RequiredNFTsMintingFilter__factory(
    signer
  ).deploy();

  deployer = await deployAndInitDeployer(
    signer,
    tokenImpl,
    timelockImpl,
    governorImpl,
    [simpleMinterImpl.address, idMinterImpl.address],
    [requiredNFTFilterImpl.address],
    SERVICE_FEE_ADDRESS
  );
};

const cloneWithFixedPriceSequentialMinter = async (
  royaltiesRecipientOverride?: string,
  royaltiesBPs?: number,
  govUpgradable?: boolean
) => {
  const tx = await deployer.clone(
    creator.address,
    {
      name: "MyToken",
      symbol: "MT",
      baseURI: BASE_URI,
      contractInfoURI: "",
      royaltiesBPs: royaltiesBPs !== undefined ? royaltiesBPs : 0,
      royaltiesRecipientOverride:
        royaltiesRecipientOverride !== undefined
          ? royaltiesRecipientOverride
          : ethers.constants.AddressZero,
      tokenURIDescriptor: zeroAddress,
    },
    {
      name: "GovName",
      proposalThreshold: PROP_THRESHOLD,
      votingDelay: VOTING_DELAY,
      votingPeriod: VOTING_PERIOD,
      quorumNumerator: QUORUM_NUMERATOR,
      timelockDelay: TIMELOCK_DELAY,
      upgradable: govUpgradable !== undefined ? govUpgradable : true,
    },
    {
      implementationIndex: 0,
      startingBlock: STARTING_BLOCK,
      creatorShares: FOUNDER_SHARES,
      daoShares: DAO_SHARES,
      extraInitCallData: simpleMinterImpl.interface.encodeFunctionData("init", [
        MAX_TOKENS,
        TOKEN_PRICE,
        MAX_MINTS_PER_WALLET,
      ]),
    },
    {
      useMintingFilter: false,
      implementationIndex: 0,
      initCallData: [],
    }
  );
  const receipt = await tx.wait();
  const event = receipt.events?.find((e) => e.event == "NewClone");

  token = new ERC721DAOToken__factory(signer).attach(event?.args?.token);
  timelock = new ERC721Timelock__factory(signer).attach(event?.args?.timelock);
  governor = new ERC721Governor__factory(signer).attach(event?.args?.governor);
  simpleMinter = new FixedPriceSequentialMinter__factory(signer).attach(
    event?.args?.minter
  );

  await simpleMinter.connect(creator).unpause();
};

const cloneWithIDMinter = async () => {
  const tx = await deployer.clone(
    creator.address,
    {
      name: "MyToken",
      symbol: "MT",
      baseURI: BASE_URI,
      contractInfoURI: "",
      royaltiesBPs: 0,
      royaltiesRecipientOverride: ethers.constants.AddressZero,
      tokenURIDescriptor: zeroAddress,
    },
    {
      name: "GovName",
      proposalThreshold: PROP_THRESHOLD,
      votingDelay: VOTING_DELAY,
      votingPeriod: VOTING_PERIOD,
      quorumNumerator: QUORUM_NUMERATOR,
      timelockDelay: TIMELOCK_DELAY,
      upgradable: true,
    },
    {
      implementationIndex: 1,
      startingBlock: STARTING_BLOCK,
      creatorShares: FOUNDER_SHARES,
      daoShares: DAO_SHARES,
      extraInitCallData: idMinterImpl.interface.encodeFunctionData("init", [
        MAX_TOKENS,
        TOKEN_PRICE,
      ]),
    },
    {
      useMintingFilter: false,
      implementationIndex: 0,
      initCallData: [],
    }
  );
  const receipt = await tx.wait();
  const event = receipt.events?.find((e) => e.event == "NewClone");

  token = new ERC721DAOToken__factory(signer).attach(event?.args?.token);
  timelock = new ERC721Timelock__factory(signer).attach(event?.args?.timelock);
  governor = new ERC721Governor__factory(signer).attach(event?.args?.governor);
  idMinter = new FixedPriceSpecificIDMinter__factory(signer).attach(
    event?.args?.minter
  );

  await idMinter.connect(creator).unpause();
};

const cloneWithSequentialMinterAndRequiredNFTFilter = async () => {
  requiredToken = await new ERC721DAOToken__factory(signer).deploy();
  await requiredToken.initialize(
    "Name",
    "Symbol",
    "baseURI",
    "",
    [MINTER_ROLE],
    [signer.address],
    {
      recipient: ethers.constants.AddressZero,
      bps: 0,
    },
    zeroAddress,
    signer.address
  );

  const tx = await deployer.clone(
    creator.address,
    {
      name: "MyToken",
      symbol: "MT",
      baseURI: BASE_URI,
      contractInfoURI: "",
      royaltiesBPs: 0,
      royaltiesRecipientOverride: ethers.constants.AddressZero,
      tokenURIDescriptor: zeroAddress,
    },
    {
      name: "GovName",
      proposalThreshold: PROP_THRESHOLD,
      votingDelay: VOTING_DELAY,
      votingPeriod: VOTING_PERIOD,
      quorumNumerator: QUORUM_NUMERATOR,
      timelockDelay: TIMELOCK_DELAY,
      upgradable: true,
    },
    {
      implementationIndex: 0,
      startingBlock: STARTING_BLOCK,
      creatorShares: FOUNDER_SHARES,
      daoShares: DAO_SHARES,
      extraInitCallData: simpleMinterImpl.interface.encodeFunctionData("init", [
        MAX_TOKENS,
        TOKEN_PRICE,
        MAX_MINTS_PER_WALLET,
      ]),
    },
    {
      useMintingFilter: true,
      implementationIndex: 0,
      initCallData: requiredNFTFilterImpl.interface.encodeFunctionData(
        "initialize",
        [creator.address, [requiredToken.address], [2]]
      ),
    }
  );
  const receipt = await tx.wait();
  const event = receipt.events?.find((e) => e.event == "NewClone");

  token = new ERC721DAOToken__factory(signer).attach(event?.args?.token);
  timelock = new ERC721Timelock__factory(signer).attach(event?.args?.timelock);
  governor = new ERC721Governor__factory(signer).attach(event?.args?.governor);
  simpleMinter = new FixedPriceSequentialMinter__factory(signer).attach(
    event?.args?.minter
  );

  await simpleMinter.connect(creator).unpause();
};

describe("End to end flows", () => {
  before(deploy);

  describe("Using FixedPriceSequentialMinter", async () => {
    before(() => cloneWithFixedPriceSequentialMinter());

    describe("minting and spending funds", async () => {
      it("lets users mint", async () => {
        let expectedMinterBalance = BigNumber.from(0);
        expect(await ethers.provider.getBalance(simpleMinter.address)).to.equal(
          expectedMinterBalance
        );

        await simpleMinter.connect(user1).mint(4, {
          value: TOKEN_PRICE.mul(4),
        });
        expectedMinterBalance = expectedMinterBalance.add(TOKEN_PRICE.mul(4));
        expect(await ethers.provider.getBalance(simpleMinter.address)).to.equal(
          expectedMinterBalance
        );

        await simpleMinter.connect(user2).mint(1, {
          value: TOKEN_PRICE,
        });
        expectedMinterBalance = expectedMinterBalance.add(TOKEN_PRICE);
        expect(await ethers.provider.getBalance(simpleMinter.address)).to.equal(
          expectedMinterBalance
        );

        await simpleMinter.connect(user3).mint(1, {
          value: TOKEN_PRICE,
        });
        expectedMinterBalance = expectedMinterBalance.add(TOKEN_PRICE);
        expect(await ethers.provider.getBalance(simpleMinter.address)).to.equal(
          expectedMinterBalance
        );

        expect(await token.ownerOf(1)).equals(user1.address);
        expect(await token.ownerOf(2)).equals(user1.address);
        expect(await token.ownerOf(3)).equals(user1.address);
        expect(await token.ownerOf(4)).equals(user1.address);
        expect(await token.ownerOf(5)).equals(user2.address);
        expect(await token.ownerOf(6)).equals(user3.address);
      });

      it("allows founder and DAO to withdraw minting funds", async () => {
        const totalSupply = await token.totalSupply();
        const totalProceeds = TOKEN_PRICE.mul(totalSupply);
        expect(await ethers.provider.getBalance(simpleMinter.address)).to.equal(
          totalProceeds
        );
        expect(await ethers.provider.getBalance(timelock.address)).to.equal(0);
        const expectedFounderProfit = totalProceeds
          .mul(FOUNDER_SHARES)
          .div(TOTAL_SHARES);
        const founderProfitFee = expectedFounderProfit
          .mul(FEE_BASIS_POINTS)
          .div(10000);
        const expectedFounderProfitMinusFee =
          expectedFounderProfit.sub(founderProfitFee);

        const expectedDAOProfit = totalProceeds.sub(expectedFounderProfit);
        const expectedDAOProfitFee = expectedDAOProfit
          .mul(FEE_BASIS_POINTS)
          .div(10000);
        const expectedDAOProfitMinusFee =
          expectedDAOProfit.sub(expectedDAOProfitFee);

        await expect(() =>
          simpleMinter.release(creator.address)
        ).to.changeEtherBalance(creator, expectedFounderProfitMinusFee);

        await simpleMinter.release(timelock.address);
        expect(await ethers.provider.getBalance(timelock.address)).to.equal(
          expectedDAOProfitMinusFee
        );

        expect(await ethers.provider.getBalance(SERVICE_FEE_ADDRESS)).to.equal(
          expectedDAOProfitFee.add(founderProfitFee)
        );
      });

      it("allows DAO to spend via proposals", async () => {
        const targets = [rando.address];
        const values = [TOKEN_PRICE];
        const callDatas = ["0x"];
        const description = "description";
        const descriptionHash = hashString(description);

        const propInfo = createTransferProp(rando.address, TOKEN_PRICE);

        await token.connect(user1).delegate(user1.address);
        const proposalId = await propose(user1, governor, propInfo);
        await advanceBlocks(VOTING_DELAY);

        await governor.connect(user1).castVote(proposalId, 1);
        await advanceBlocks(VOTING_PERIOD);

        await governor.queue(targets, values, callDatas, descriptionHash);
        const eta = await governor.proposalEta(proposalId);
        await setNextBlockTimestamp(eta.toNumber(), false);

        expect(() =>
          governor.execute(targets, values, callDatas, descriptionHash)
        ).to.changeEtherBalance(rando, TOKEN_PRICE);
      });
    });

    describe("ownerMint", async () => {
      it("lets the creator use ownerMint on themselves", async () => {
        await simpleMinter.connect(creator).ownerMint(creator.address, 1);
      });

      it("lets the creator use ownerMint on Timelock", async () => {
        await simpleMinter.connect(creator).ownerMint(timelock.address, 1);
      });
    });

    describe("Governance Parameter Changes", async () => {
      it("allows changing proposal threshold via proposals", async () => {
        const newValue = (await governor.proposalThreshold()).add(1);
        const calldata = governor.interface.encodeFunctionData(
          "setProposalThreshold",
          [newValue]
        );

        await proposeAndExecute(user1, governor, {
          targets: [governor.address],
          values: [0],
          callDatas: [calldata],
          description: "description",
          descriptionHash: hashString("description"),
        });

        expect(await governor.proposalThreshold()).to.equal(newValue);
      });

      it("allows changing voting delay via proposals", async () => {
        const newValue = (await governor.votingDelay()).add(10);
        const calldata = governor.interface.encodeFunctionData(
          "setVotingDelay",
          [newValue]
        );

        await proposeAndExecute(user1, governor, {
          targets: [governor.address],
          values: [0],
          callDatas: [calldata],
          description: "description",
          descriptionHash: hashString("description"),
        });

        expect(await governor.votingDelay()).to.equal(newValue);
      });

      it("allows changing voting period via proposals", async () => {
        const newValue = (await governor.votingPeriod()).add(1);
        const calldata = governor.interface.encodeFunctionData(
          "setVotingPeriod",
          [newValue]
        );

        await proposeAndExecute(user1, governor, {
          targets: [governor.address],
          values: [0],
          callDatas: [calldata],
          description: "description",
          descriptionHash: hashString("description"),
        });

        expect(await governor.votingPeriod()).to.equal(newValue);
      });

      it("allows changing quorum numerator via proposals", async () => {
        const newValue = 40;
        const calldata = governor.interface.encodeFunctionData(
          "updateQuorumNumerator",
          [newValue]
        );

        await proposeAndExecute(user1, governor, {
          targets: [governor.address],
          values: [0],
          callDatas: [calldata],
          description: "description",
          descriptionHash: hashString("description"),
        });

        expect(await governor.quorumNumerator()).to.equal(newValue);
      });
    });

    describe("Governance Params Enforcement", async () => {
      it("propose reverts when called from an account with insufficient tokens", async () => {
        expect(await token.balanceOf(user4.address)).to.equal(0);

        const propInfo = createTransferProp(rando.address, 1);

        await expect(propose(user4, governor, propInfo)).to.be.revertedWith(
          "GovernorCompatibilityBravo: proposer votes below proposal threshold"
        );
      });

      it("blocks voting during voting delay", async () => {
        const propInfo = createTransferProp(rando.address, 1);
        const propId = await propose(user1, governor, propInfo);
        await advanceBlocks((await governor.votingDelay()).toNumber() - 2);

        await expect(
          governor.connect(user1).castVote(propId, 1)
        ).to.be.revertedWith("Governor: vote not currently active");
      });

      it("blocks voting after voting period", async () => {
        const propInfo = createTransferProp(rando.address, 2);
        const propId = await propose(user1, governor, propInfo);
        await advanceBlocks((await governor.votingDelay()).toNumber());
        await advanceBlocks((await governor.votingPeriod()).toNumber());

        await expect(
          governor.connect(user1).castVote(propId, 1)
        ).to.be.revertedWith("Governor: vote not currently active");
      });

      it("fails proposals that did not reach quorum", async () => {
        const quorum = await governor.quorum(
          (await governor.provider.getBlockNumber()) - 1
        );
        const voterVotes = await token.getVotes(user2.address);
        expect(quorum.toNumber()).to.be.greaterThan(voterVotes.toNumber());

        const propInfo = createTransferProp(rando.address, 3);
        const propId = await propose(user1, governor, propInfo);
        await advanceBlocks((await governor.votingDelay()).toNumber());
        await governor.connect(user2).castVote(propId, 1);
        await advanceBlocks((await governor.votingPeriod()).toNumber());

        expect(await governor.state(propId)).to.equal(3); // 3 is Defeated
      });

      it("blocks props from being executed during the timelock delay", async () => {
        const propInfo = createTransferProp(rando.address, 4);
        const propId = await propose(user1, governor, propInfo);

        await advanceBlocks((await governor.votingDelay()).toNumber());
        await governor.connect(user1).castVote(propId, 1);
        await advanceBlocks((await governor.votingPeriod()).toNumber());

        await governor.queue(
          propInfo.targets,
          propInfo.values,
          propInfo.callDatas,
          propInfo.descriptionHash
        );

        const eta = await governor.proposalEta(propId);
        await setNextBlockTimestamp(eta.toNumber() - 2, false);

        await expect(
          governor.execute(
            propInfo.targets,
            propInfo.values,
            propInfo.callDatas,
            propInfo.descriptionHash
          )
        ).to.be.revertedWith("TimelockController: operation is not ready");
      });
    });

    describe("With MintingFilter", async () => {
      before(async () => {
        await cloneWithSequentialMinterAndRequiredNFTFilter();

        requiredToken.connect(signer).mint(user3.address, 1);
        requiredToken.connect(signer).mint(user3.address, 2);
        requiredToken.connect(signer).mint(user2.address, 3);
      });

      it("blocks minting for users who don't have enough of the filter token", async () => {
        await expect(
          simpleMinter.connect(user1).mint(1, {
            value: TOKEN_PRICE,
          })
        ).to.be.revertedWith(
          "ERC721Minter: mintingFilter requirements not met"
        );

        await expect(
          simpleMinter.connect(user2).mint(1, {
            value: TOKEN_PRICE,
          })
        ).to.be.revertedWith(
          "ERC721Minter: mintingFilter requirements not met"
        );
      });

      it("allows minting for users who have enough of the filter token", async () => {
        const expectedBalance = (await token.balanceOf(user3.address)).add(1);

        await simpleMinter.connect(user3).mint(1, {
          value: TOKEN_PRICE,
        });

        expect(await token.balanceOf(user3.address)).to.equal(expectedBalance);
      });
    });

    describe("Royalties", async () => {
      // TODO make sure royalties from init also work

      it("sets royalty info in deployer with recipient override", async () => {
        await cloneWithFixedPriceSequentialMinter(user2.address, 500);

        const [recipient, royaltyAmount] = await token.royaltyInfo(0, 100);

        expect(recipient).to.equal(user2.address);
        expect(royaltyAmount).to.equal(5);
      });

      it("sets royalty info in deployer with timelock as the default recipient", async () => {
        await cloneWithFixedPriceSequentialMinter(undefined, 500);

        const [recipient, royaltyAmount] = await token.royaltyInfo(0, 100);

        expect(recipient).to.equal(timelock.address);
        expect(royaltyAmount).to.equal(5);
      });

      it("allows creator to set royalty info, and anyone to get that info", async () => {
        await token.connect(creator).setRoyalties(user3.address, 100);

        const [recipient, royaltyAmount] = await token.royaltyInfo(
          0,
          parseEther("1")
        );

        expect(recipient).to.equal(user3.address);
        expect(royaltyAmount).to.equal(parseEther("0.01"));
      });

      it("returns true when supportsInterface is called with the 2981 interfaceId", async () => {
        // The interface hex value is from the EIP doc: https://eips.ethereum.org/EIPS/eip-2981#examples
        expect(await token.supportsInterface("0x2a55205a")).to.be.true;
      });

      it("rounds down given royalty amounts with remainder", async () => {
        await token.connect(creator).setRoyalties(user3.address, 1000);

        const [recipient, royaltyAmount] = await token.royaltyInfo(0, 999);

        expect(royaltyAmount).to.equal(99);
      });

      it("reverts when non-creators try to set royalty info", async () => {
        await expect(
          token.connect(rando).setRoyalties(user3.address, 100)
        ).to.be.revertedWith(
          `AccessControl: account ${rando.address.toLowerCase()} is missing role 0xc1548a18d6737e6c2687f3c32faa16a7b067bcc7ff7bfb5eb1bf50f8977c0de3'`
        );
      });
    });

    describe("ProxyRegisttry", async () => {
      beforeEach(async () => {
        await deployMockProxyRegistry();
      });

      it("lets creator enable proxy registry and set its address", async () => {
        expect(await token.proxyRegistryEnabled()).to.be.false;
        await token.connect(creator).setProxyRegistryEnabled(true);
        expect(await token.proxyRegistryEnabled()).to.be.true;

        expect(await token.proxyRegistry()).to.equal(
          ethers.constants.AddressZero
        );
        await token
          .connect(creator)
          .setProxyRegistry(mockProxyRegistry.address);
        expect(await token.proxyRegistry()).to.equal(mockProxyRegistry.address);

        await token
          .connect(creator)
          .setProxyRegistry(ethers.constants.AddressZero);
        await token.connect(creator).setProxyRegistryEnabled(false);
        expect(await token.proxyRegistry()).to.equal(
          ethers.constants.AddressZero
        );
        expect(await token.proxyRegistryEnabled()).to.be.false;

        await token
          .connect(creator)
          .setProxyRegistryAndEnable(mockProxyRegistry.address);
        expect(await token.proxyRegistryEnabled()).to.be.true;
        expect(await token.proxyRegistry()).to.equal(mockProxyRegistry.address);
      });

      it("blocks non-creators from setting the proxy and enabling it", async () => {
        await expect(
          token.connect(rando).setProxyRegistryEnabled(true)
        ).to.be.revertedWith(
          `AccessControl: account ${rando.address.toLowerCase()} is missing role 0xc18654fb5816bebd145b69a69dc6bb85a6359482b746c9678021eb26e247f691'`
        );

        await expect(
          token.connect(rando).setProxyRegistry(mockProxyRegistry.address)
        ).to.be.revertedWith(
          `AccessControl: account ${rando.address.toLowerCase()} is missing role 0xc18654fb5816bebd145b69a69dc6bb85a6359482b746c9678021eb26e247f691'`
        );

        await expect(
          token
            .connect(rando)
            .setProxyRegistryAndEnable(mockProxyRegistry.address)
        ).to.be.revertedWith(
          `AccessControl: account ${rando.address.toLowerCase()} is missing role 0xc18654fb5816bebd145b69a69dc6bb85a6359482b746c9678021eb26e247f691'`
        );
      });

      it("isApprovedForAll returns true when the operator is registered", async () => {
        await token
          .connect(creator)
          .setProxyRegistryAndEnable(mockProxyRegistry.address);

        const owner = user1;
        const operator = user2;
        await mockProxyRegistry.setReturnValueForOwner(
          owner.address,
          operator.address
        );

        expect(await token.isApprovedForAll(owner.address, operator.address)).to
          .be.true;
      });

      it("isApprovedForAll returns false when the operator is not registered", async () => {
        await token
          .connect(creator)
          .setProxyRegistryAndEnable(mockProxyRegistry.address);

        const owner = user1;
        const operator = user2;
        await mockProxyRegistry.setReturnValueForOwner(
          owner.address,
          ethers.constants.AddressZero
        );

        expect(await token.isApprovedForAll(owner.address, operator.address)).to
          .be.false;
      });

      it("isApprovedForAll returns true when the operator is not registered, but is approved via ERC721 approval", async () => {
        await token
          .connect(creator)
          .setProxyRegistryAndEnable(mockProxyRegistry.address);

        const owner = user1;
        const operator = user2;
        await mockProxyRegistry.setReturnValueForOwner(
          owner.address,
          operator.address
        );

        await token.connect(owner).setApprovalForAll(operator.address, true);

        expect(await token.isApprovedForAll(owner.address, operator.address)).to
          .be.true;
      });
    });

    describe("Delegates", async () => {
      before(async () => {
        await simpleMinter.connect(user1).mint(4, {
          value: TOKEN_PRICE.mul(4),
        });
      });

      it("allows token holder to delegate votes to another account", async () => {
        await token.connect(user1).delegate(user1.address);
        const user1Votes = await token.getVotes(user1.address);
        expect(await token.delegates(user1.address)).to.equal(user1.address);
        expect(await token.getVotes(rando.address)).to.equal(0);

        await token.connect(user1).delegate(rando.address);

        expect(await token.delegates(user1.address)).to.equal(rando.address);
        expect(await token.getVotes(rando.address)).to.equal(user1Votes);
      });

      it("allows delegator to take back their delegated votes", async () => {
        const user1Balance = await token.balanceOf(user1.address);
        expect(await token.delegates(user1.address)).to.equal(rando.address);

        await token.connect(user1).delegate(user1.address);

        expect(await token.delegates(user1.address)).to.equal(user1.address);
        expect(await token.getVotes(rando.address)).to.equal(0);
        expect(await token.getVotes(user1.address)).to.equal(user1Balance);
      });

      it("allows delegator to transfer a token, leaving the remaining delegated votes still delegated", async () => {
        await token.connect(user3).delegate(user3.address);
        const user1OriginalBalance = await token.balanceOf(user1.address);
        const user3OriginalVotes = await token.getVotes(user3.address);
        await token.connect(user1).delegate(rando.address);

        await token
          .connect(user1)
          .transferFrom(user1.address, user3.address, 1);

        expect(await token.getVotes(rando.address)).to.equal(
          user1OriginalBalance.sub(1)
        );
        expect(await token.getVotes(user3.address)).to.equal(
          user3OriginalVotes.add(1)
        );
      });

      it("allows delegate to cast votes", async () => {
        const propInfo = createTransferProp(user2.address, TOKEN_PRICE);
        const proposalId = await propose(rando, governor, propInfo);
        await advanceBlocks(VOTING_DELAY);
        const expectedWeight = await token.getVotes(rando.address);

        const tx = await governor.connect(rando).castVote(proposalId, 1);
        const receipt = await tx.wait();
        const event = receipt.events?.find((e) => e.event === "VoteCast");

        expect(event?.args?.proposalId).to.equal(proposalId);
        expect(event?.args?.voter).to.equal(rando.address);
        expect(event?.args?.weight).to.equal(expectedWeight);
        expect(event?.args?.support).to.equal(1);

        const propVotes = await governor.proposalVotes(proposalId);
        expect(propVotes[1]).to.equal(expectedWeight);
      });
    });

    describe("ERC20 ownership", async () => {
      let erc20: ERC20Stub;

      before(async () => {
        erc20 = await new ERC20Stub__factory(signer).deploy(
          "TokenName",
          "Symbol"
        );

        // making sure user1 can propose and vote
        await simpleMinter.connect(user2).mint(4, {
          value: TOKEN_PRICE.mul(4),
        });
        await token.connect(user2).delegate(user2.address);
      });

      it("timelock can hold ERC20", async () => {
        await erc20.mint(timelock.address, 100);
      });

      it("DAO can transfer ERC20 tokens to someone else", async () => {
        const calldata = erc20.interface.encodeFunctionData("transfer", [
          rando.address,
          100,
        ]);
        expect(await erc20.balanceOf(rando.address)).to.equal(0);

        await proposeAndExecute(user2, governor, {
          targets: [erc20.address],
          values: [0],
          callDatas: [calldata],
          description: "description",
          descriptionHash: hashString("description"),
        });

        expect(await erc20.balanceOf(rando.address)).to.equal(100);
      });
    });
  });

  describe("Using FixedPriceSpecificIDMinter", async () => {
    before(cloneWithIDMinter);

    it("lets users mint", async () => {
      let expectedMinterBalance = BigNumber.from(0);
      expect(await ethers.provider.getBalance(idMinter.address)).to.equal(
        expectedMinterBalance
      );

      await idMinter.connect(user1).mint(0, {
        value: TOKEN_PRICE,
      });
      expectedMinterBalance = expectedMinterBalance.add(TOKEN_PRICE);
      expect(await ethers.provider.getBalance(idMinter.address)).to.equal(
        expectedMinterBalance
      );

      await idMinter.connect(user2).mint(1, {
        value: TOKEN_PRICE,
      });
      expectedMinterBalance = expectedMinterBalance.add(TOKEN_PRICE);
      expect(await ethers.provider.getBalance(idMinter.address)).to.equal(
        expectedMinterBalance
      );

      await idMinter.connect(user3).mint(2, {
        value: TOKEN_PRICE,
      });
      expectedMinterBalance = expectedMinterBalance.add(TOKEN_PRICE);
      expect(await ethers.provider.getBalance(idMinter.address)).to.equal(
        expectedMinterBalance
      );

      expect(await token.ownerOf(0)).equals(user1.address);
      expect(await token.ownerOf(1)).equals(user2.address);
      expect(await token.ownerOf(2)).equals(user3.address);
    });

    it("allows founder and DAO to withdraw minting funds", async () => {
      const totalSupply = await token.totalSupply();
      const totalProceeds = TOKEN_PRICE.mul(totalSupply.toNumber());
      expect(await ethers.provider.getBalance(idMinter.address)).to.equal(
        totalProceeds
      );
      expect(await ethers.provider.getBalance(timelock.address)).to.equal(0);

      const expectedFounderProfit = totalProceeds
        .mul(FOUNDER_SHARES)
        .div(TOTAL_SHARES);
      const founderProfitFee = expectedFounderProfit
        .mul(FEE_BASIS_POINTS)
        .div(10000);
      const expectedFounderProfitMinusFee =
        expectedFounderProfit.sub(founderProfitFee);

      const expectedDAOProfit = totalProceeds.sub(expectedFounderProfit);
      const expectedDAOProfitFee = expectedDAOProfit
        .mul(FEE_BASIS_POINTS)
        .div(10000);
      const expectedDAOProfitMinusFee =
        expectedDAOProfit.sub(expectedDAOProfitFee);

      await expect(() =>
        idMinter.release(creator.address)
      ).to.changeEtherBalance(creator, expectedFounderProfitMinusFee);

      await idMinter.release(timelock.address);
      expect(await ethers.provider.getBalance(timelock.address)).to.equal(
        expectedDAOProfitMinusFee
      );
    });

    describe("With RequiredNFTsMintingFilter", async () => {
      let mintingFilter: RequiredNFTsMintingFilter;

      before(async () => {
        const otherToken = await new ERC721DAOToken__factory(signer).deploy();
        await otherToken.initialize(
          "Name",
          "Symbol",
          "baseURI",
          "",
          [MINTER_ROLE],
          [signer.address],
          {
            recipient: ethers.constants.AddressZero,
            bps: 0,
          },
          zeroAddress,
          signer.address
        );

        mintingFilter = await new RequiredNFTsMintingFilter__factory(
          signer
        ).deploy();
        await mintingFilter.initialize(
          creator.address,
          [otherToken.address],
          [2]
        );

        await idMinter.connect(creator).setMintingFilter(mintingFilter.address);

        otherToken.connect(signer).mint(user3.address, 1);
        otherToken.connect(signer).mint(user3.address, 2);
        otherToken.connect(signer).mint(user2.address, 3);
      });

      it("blocks minting for users who don't have enough of the filter token", async () => {
        await expect(
          idMinter.connect(user1).mint(1, {
            value: TOKEN_PRICE,
          })
        ).to.be.revertedWith(
          "ERC721Minter: mintingFilter requirements not met"
        );

        await expect(
          idMinter.connect(user2).mint(1, {
            value: TOKEN_PRICE,
          })
        ).to.be.revertedWith(
          "ERC721Minter: mintingFilter requirements not met"
        );
      });

      it("allows minting for users who have enough of the filter token", async () => {
        const expectedBalance = (await token.balanceOf(user3.address)).add(1);

        await idMinter.connect(user3).mint(1234, {
          value: TOKEN_PRICE,
        });

        expect(await token.balanceOf(user3.address)).to.equal(expectedBalance);
      });

      it("allows creator to set new token filters", async () => {
        const tokenFilters = await mintingFilter.getTokenFilters();
        const newMinBalance = tokenFilters[0].minBalance.add(10);

        await mintingFilter
          .connect(creator)
          .setTokenFilters([tokenFilters[0].token], [newMinBalance]);

        expect((await mintingFilter.tokenFilters(0)).minBalance).to.equal(
          newMinBalance
        );
        expect(await mintingFilter.tokenFiltersCount()).to.equal(1);
      });

      it("blocks non-creators from setting new token filters", async () => {
        const tokenFilters = await mintingFilter.getTokenFilters();

        await expect(
          mintingFilter
            .connect(user1)
            .setTokenFilters(
              [tokenFilters[0].token],
              [tokenFilters[0].minBalance.add(123)]
            )
        ).to.be.revertedWith("Ownable: caller is not the owner");
      });
    });
  });

  describe("Token", async () => {
    describe("Minter Swap", async () => {
      before(cloneWithIDMinter);

      it("non-creators cannot swap minters", async () => {
        const newMinterAddress = await cloneAndinitContract(
          deployer,
          simpleMinterImpl.address,
          simpleMinterImpl.interface.encodeFunctionData("initialize", [
            creator.address,
            token.address,
            1,
            [creator.address],
            [100],
            ethers.constants.AddressZero,
            simpleMinterImpl.interface.encodeFunctionData("init", [
              MAX_TOKENS,
              TOKEN_PRICE,
              MAX_MINTS_PER_WALLET,
            ]),
            zeroAddress,
            0,
            zeroAddress,
          ])
        );
        expect(await token.hasRole(MINTER_ROLE, idMinter.address)).to.be.true;

        await expect(
          token.connect(rando).swapMinter(newMinterAddress)
        ).to.be.revertedWith(
          `AccessControl: account ${rando.address.toLowerCase()} is missing role 0x70480ee89cb38eff00b7d23da25713d52ce19c6ed428691d22c58b2f615e3d67`
        );
      });

      it("creator can swap minters", async () => {
        const newMinterAddress = await cloneAndinitContract(
          deployer,
          simpleMinterImpl.address,
          simpleMinterImpl.interface.encodeFunctionData("initialize", [
            creator.address,
            token.address,
            1,
            [creator.address],
            [100],
            ethers.constants.AddressZero,
            simpleMinterImpl.interface.encodeFunctionData("init", [
              MAX_TOKENS,
              TOKEN_PRICE,
              MAX_MINTS_PER_WALLET,
            ]),
            zeroAddress,
            0,
            zeroAddress,
          ])
        );
        expect(await token.hasRole(MINTER_ROLE, idMinter.address)).to.be.true;

        const swapTx = await token
          .connect(creator)
          .swapMinter(newMinterAddress);
        const swapReceipt = await swapTx.wait();
        const event = swapReceipt.events?.find(
          (e) => e.event === "MinterChanged"
        );

        expect(event?.args?.newMinter).to.equal(newMinterAddress);
        expect(event?.args?.oldMinter).to.equal(idMinter.address);
        expect(await token.hasRole(MINTER_ROLE, idMinter.address)).to.be.false;
        expect(await token.hasRole(MINTER_ROLE, newMinterAddress)).to.be.true;
      });
    });

    describe("Token Roles", async () => {
      before(cloneWithIDMinter);

      it("creator is admin of all roles: minter and base URI, and doesn't have default admin", async () => {
        expect(await token.hasRole(MINTER_ADMIN_ROLE, creator.address)).to.be
          .true;
        expect(await token.hasRole(BASE_URI_ADMIN_ROLE, creator.address)).to.be
          .true;
        expect(await token.hasRole(ROYALTIES_ADMIN_ROLE, creator.address)).to.be
          .true;
        expect(await token.hasRole(PROXY_REGISTRY_ADMIN_ROLE, creator.address))
          .to.be.true;
        expect(await token.hasRole(TRANSFERS_ADMIN_ROLE, creator.address)).to.be
          .true;

        // DEFAULT_ADMIN_ROLE can be risky, best not to have it.
        expect(await token.hasRole(DEFAULT_ADMIN_ROLE, creator.address)).to.be
          .false;
      });

      it("creator can assign roles: minter, base URI, royalties and transfers", async () => {
        await token.connect(creator).grantRole(MINTER_ROLE, rando.address);
        await token.connect(creator).grantRole(BASE_URI_ROLE, user2.address);
        await token.connect(creator).grantRole(ROYALTIES_ROLE, user3.address);
        await token
          .connect(creator)
          .grantRole(PROXY_REGISTRY_ROLE, user1.address);
        await token.connect(creator).grantRole(TRANSFERS_ROLE, rando.address);
      });

      it("creator can assign the admin roles to the DAO", async () => {
        await token
          .connect(creator)
          .grantRole(MINTER_ADMIN_ROLE, timelock.address);
        await token
          .connect(creator)
          .grantRole(BASE_URI_ADMIN_ROLE, timelock.address);
        await token
          .connect(creator)
          .grantRole(ROYALTIES_ADMIN_ROLE, timelock.address);
        await token
          .connect(creator)
          .grantRole(PROXY_REGISTRY_ADMIN_ROLE, timelock.address);
        await token
          .connect(creator)
          .grantRole(TRANSFERS_ADMIN_ROLE, timelock.address);
        await token
          .connect(creator)
          .grantRole(ADMINS_ADMIN_ROLE, timelock.address);

        expect(await token.hasRole(MINTER_ADMIN_ROLE, timelock.address)).to.be
          .true;
        expect(await token.hasRole(BASE_URI_ADMIN_ROLE, timelock.address)).to.be
          .true;
        expect(await token.hasRole(ROYALTIES_ADMIN_ROLE, timelock.address)).to
          .be.true;
        expect(await token.hasRole(PROXY_REGISTRY_ADMIN_ROLE, timelock.address))
          .to.be.true;
        expect(await token.hasRole(TRANSFERS_ADMIN_ROLE, timelock.address)).to
          .be.true;
        expect(await token.hasRole(ADMINS_ADMIN_ROLE, timelock.address)).to.be
          .true;
      });

      it("creator can renounce admin roles and then cannot assign roles any longer", async () => {
        await token
          .connect(creator)
          .renounceRole(MINTER_ADMIN_ROLE, creator.address);
        await token
          .connect(creator)
          .renounceRole(BASE_URI_ADMIN_ROLE, creator.address);
        await token
          .connect(creator)
          .renounceRole(ROYALTIES_ADMIN_ROLE, creator.address);
        await token
          .connect(creator)
          .renounceRole(PROXY_REGISTRY_ADMIN_ROLE, creator.address);
        await token
          .connect(creator)
          .renounceRole(TRANSFERS_ADMIN_ROLE, creator.address);

        await expect(
          token.connect(creator).grantRole(MINTER_ROLE, user1.address)
        ).to.revertedWith(
          `AccessControl: account ${creator.address.toLowerCase()} is missing role 0x70480ee89cb38eff00b7d23da25713d52ce19c6ed428691d22c58b2f615e3d67`
        );
        await expect(
          token.connect(creator).grantRole(BASE_URI_ROLE, user3.address)
        ).to.revertedWith(
          `AccessControl: account ${creator.address.toLowerCase()} is missing role 0xe0d0d9e49dfab9a7a7b34707b3c82b3f11c47969a80cdc398ea138bce37e99a9`
        );
        await expect(
          token.connect(creator).grantRole(ROYALTIES_ROLE, rando.address)
        ).to.revertedWith(
          `AccessControl: account ${creator.address.toLowerCase()} is missing role 0x0381f8bcf86f2b12a863dd00cfdf78e684eab780875b06ce2779aaa7475c64db`
        );
        await expect(
          token.connect(creator).grantRole(PROXY_REGISTRY_ROLE, rando.address)
        ).to.revertedWith(
          `AccessControl: account ${creator.address.toLowerCase()} is missing role 0xf8d9113c652f85b5d786c220fee7c2f4d9a34612f89b0401c1492016305e6382`
        );
        await expect(
          token.connect(creator).grantRole(TRANSFERS_ROLE, user2.address)
        ).to.revertedWith(
          `AccessControl: account ${creator.address.toLowerCase()} is missing role 0x6ef6c12113840e73bf704de56ef147ea7406477154c3d8cfa0b9d1a47c607472`
        );
      });

      it("creator can renounce the super admin role, and then cannot assign admin roles", async () => {
        expect(await token.hasRole(ADMINS_ADMIN_ROLE, creator.address)).to.be
          .true;
        await token
          .connect(creator)
          .renounceRole(ADMINS_ADMIN_ROLE, creator.address);
        expect(await token.hasRole(ADMINS_ADMIN_ROLE, creator.address)).to.be
          .false;

        await expect(
          token.connect(creator).grantRole(ADMINS_ADMIN_ROLE, timelock.address)
        ).to.be.revertedWith(
          `AccessControl: account ${creator.address.toLowerCase()} is missing role 0x778f133ac0489209d5e8c78e45e9d0226a824164fd90f9892f5d8214632583e0'`
        );
        await expect(
          token.connect(creator).grantRole(MINTER_ADMIN_ROLE, timelock.address)
        ).to.be.revertedWith(
          `AccessControl: account ${creator.address.toLowerCase()} is missing role 0x778f133ac0489209d5e8c78e45e9d0226a824164fd90f9892f5d8214632583e0'`
        );
        await expect(
          token
            .connect(creator)
            .grantRole(BASE_URI_ADMIN_ROLE, timelock.address)
        ).to.be.revertedWith(
          `AccessControl: account ${creator.address.toLowerCase()} is missing role 0x778f133ac0489209d5e8c78e45e9d0226a824164fd90f9892f5d8214632583e0'`
        );
        await expect(
          token
            .connect(creator)
            .grantRole(ROYALTIES_ADMIN_ROLE, timelock.address)
        ).to.be.revertedWith(
          `AccessControl: account ${creator.address.toLowerCase()} is missing role 0x778f133ac0489209d5e8c78e45e9d0226a824164fd90f9892f5d8214632583e0'`
        );
        await expect(
          token
            .connect(creator)
            .grantRole(PROXY_REGISTRY_ADMIN_ROLE, timelock.address)
        ).to.be.revertedWith(
          `AccessControl: account ${creator.address.toLowerCase()} is missing role 0x778f133ac0489209d5e8c78e45e9d0226a824164fd90f9892f5d8214632583e0'`
        );
        await expect(
          token
            .connect(creator)
            .grantRole(TRANSFERS_ADMIN_ROLE, timelock.address)
        ).to.be.revertedWith(
          `AccessControl: account ${creator.address.toLowerCase()} is missing role 0x778f133ac0489209d5e8c78e45e9d0226a824164fd90f9892f5d8214632583e0'`
        );
      });

      it("creator is owner of contract", async () => {
        expect(await token.owner()).to.be.equal(creator.address);
      });

      it("creator can transfer ownership", async () => {
        await token.connect(creator).transferOwnership(rando.address);
        expect(await token.owner()).to.be.equal(rando.address);
      });
    });

    describe("Disable Transfers", async () => {
      before(() => cloneWithFixedPriceSequentialMinter());

      it("allows transfers by default", async () => {
        expect(await token.transfersDisabled()).to.be.false;
        await simpleMinter.connect(creator).ownerMint(user1.address, 2);

        await token
          .connect(user1)
          .transferFrom(user1.address, user2.address, 1);

        expect(await token.ownerOf(1)).to.equal(user2.address);
      });

      it("blocks non-creators from disabling transfers", async () => {
        await expect(
          token.connect(rando).setTransfersDisabled(true)
        ).to.be.revertedWith(
          `AccessControl: account ${rando.address.toLowerCase()} is missing role 0x87cc606d01ebb1094d9a6177e5e096c8ea6b6505e2a8a00a3ea7a38ad55b3619`
        );
      });

      it("allows creator to disable transfers", async () => {
        await token.connect(creator).setTransfersDisabled(true);

        await expect(
          token.connect(user1).transferFrom(user1.address, user2.address, 2)
        ).to.be.revertedWith("TransfersDisabled()");
      });

      it("still supports minting when transfers are disabled", async () => {
        await token.connect(creator).setTransfersDisabled(true);

        await simpleMinter.connect(creator).ownerMint(user3.address, 2);

        await simpleMinter.connect(user3).mint(1, {
          value: TOKEN_PRICE,
        });
      });
    });
  });

  describe("Upgradability of contracts", async () => {
    let newGovContractLogic: GovernorUpgradeMock;
    let newTimelockContractLogic: TimelockUpgradeMock;

    before(() => cloneWithFixedPriceSequentialMinter());

    describe("Governor contract upgrades", async () => {
      before(async () => {
        newGovContractLogic = await new GovernorUpgradeMock__factory(
          signer
        ).deploy();
      });

      it("gov is not running new version", async () => {
        let newGov = new GovernorUpgradeMock__factory(user1).attach(
          governor.address
        );
        await expect(newGov.newGovFunction()).to.be.reverted;
      });

      it("allows gov to upgrade", async () => {
        await simpleMinter.connect(user1).mint(4, {
          value: TOKEN_PRICE.mul(4),
        });
        await token.connect(user1).delegate(user1.address);

        const calldata = governor.interface.encodeFunctionData("upgradeTo", [
          newGovContractLogic.address,
        ]);

        await proposeAndExecute(user1, governor, {
          targets: [governor.address],
          values: [0],
          callDatas: [calldata],
          description: "description",
          descriptionHash: hashString("description"),
        });

        let newGov = new GovernorUpgradeMock__factory(user1).attach(
          governor.address
        );
        expect(await newGov.newGovFunction()).to.be.equal(
          "hello from the new gov"
        );
      });

      it("doesn't allow non gov to upgrade", async () => {
        await expect(
          governor.connect(user1).upgradeTo(newGovContractLogic.address)
        ).to.be.revertedWith("Governor: onlyGovernance");
      });
    });

    describe("Timelock contract upgrade", async () => {
      before(async () => {
        newTimelockContractLogic = await new TimelockUpgradeMock__factory(
          signer
        ).deploy();
      });

      it("timelock is not running new version", async () => {
        await expect(
          newTimelockContractLogic
            .attach(timelock.address)
            .newTimelockFunction()
        ).to.be.reverted;
      });

      it("allows gov to upgrade", async () => {
        await simpleMinter.connect(user1).mint(4, {
          value: TOKEN_PRICE.mul(4),
        });

        const calldata = timelock.interface.encodeFunctionData("upgradeTo", [
          newTimelockContractLogic.address,
        ]);

        await proposeAndExecute(user1, governor, {
          targets: [timelock.address],
          values: [0],
          callDatas: [calldata],
          description: "description",
          descriptionHash: hashString("description"),
        });

        expect(
          await newTimelockContractLogic
            .attach(timelock.address)
            .newTimelockFunction()
        ).to.be.equal("hello from the new timelock");
      });

      it("doesn't allow non gov to upgrade", async () => {
        await expect(
          timelock.connect(user1).upgradeTo(newTimelockContractLogic.address)
        )
          .to.be.revertedWith("AccessControl: ")
          .and.to.be.revertedWith(
            "is missing role 0x5f58e3a2316349923ce3780f8d587db2d72378aed66a8261c916544fa6846ca5"
          );
      });
    });

    describe("Non-upgradable Governance Clones", async () => {
      before(async () => {
        await cloneWithFixedPriceSequentialMinter(undefined, undefined, false);
        newGovContractLogic = await new GovernorUpgradeMock__factory(
          signer
        ).deploy();
        newTimelockContractLogic = await new TimelockUpgradeMock__factory(
          signer
        ).deploy();

        await simpleMinter.connect(creator).ownerMint(user1.address, 4);
        await token.connect(user1).delegate(user1.address);
      });

      it("reverts when attempting to upgrade the governor clone", async () => {
        const calldata = governor.interface.encodeFunctionData("upgradeTo", [
          newGovContractLogic.address,
        ]);

        await expect(
          proposeAndExecute(user1, governor, {
            targets: [governor.address],
            values: [0],
            callDatas: [calldata],
            description: "description",
            descriptionHash: hashString("description"),
          })
        ).to.be.revertedWith(
          "TimelockController: underlying transaction reverted"
        );
      });

      it("reverts when attempting to upgrade the timelock clone", async () => {
        const calldata = timelock.interface.encodeFunctionData("upgradeTo", [
          newTimelockContractLogic.address,
        ]);

        await expect(
          proposeAndExecute(user1, governor, {
            targets: [timelock.address],
            values: [0],
            callDatas: [calldata],
            description: "description",
            descriptionHash: hashString("description"),
          })
        ).to.be.revertedWith(
          "TimelockController: underlying transaction reverted"
        );
      });
    });
  });

  describe("Deployer", async () => {
    it("can use it to clone a token and minter and initialize them", async () => {
      const tokenAddress = await cloneContract(deployer, tokenImpl.address);
      const minterAddress = await cloneContract(
        deployer,
        simpleMinterImpl.address
      );

      const tokenClone = new ERC721DAOToken__factory(signer).attach(
        tokenAddress
      );
      const minterClone = new FixedPriceSequentialMinter__factory(
        signer
      ).attach(minterAddress);

      await initToken(
        tokenClone,
        signer.address,
        signer.address,
        minterClone.address,
        undefined,
        undefined,
        undefined,
        undefined,
        signer.address
      );

      await minterClone.initialize(
        signer.address,
        tokenClone.address,
        1,
        [signer.address],
        [100],
        ethers.constants.AddressZero,
        minterClone.interface.encodeFunctionData("init", [
          MAX_TOKENS,
          TOKEN_PRICE,
          MAX_MINTS_PER_WALLET,
        ]),
        zeroAddress,
        0,
        zeroAddress
      );

      await minterClone.connect(signer).unpause();

      await minterClone.mint(2, {
        value: TOKEN_PRICE.mul(2),
      });

      expect(await tokenClone.totalSupply()).to.equal(2);
      expect(await tokenClone.balanceOf(signer.address)).to.equal(2);
    });
  });

  describe("Deployer charging minting fees", async () => {
    let snapshotId: number;

    beforeEach(async () => {
      snapshotId = await ethers.provider.send("evm_snapshot", []);
    });

    afterEach(async () => {
      await ethers.provider.send("evm_revert", [snapshotId]);
    });

    it("doesn't allow non deployer owner to change the fee params of a cloned project", async () => {
      await cloneWithFixedPriceSequentialMinter();

      await expect(
        simpleMinter.connect(creator).setServiceFeeBasisPoints(0)
      ).to.be.revertedWith(
        `AccessControl: account ${creator.address.toLowerCase()} is missing role 0xfc425f2263d0df187444b70e47283d622c70181c5baebb1306a01edba1ce184c`
      );

      await expect(
        simpleMinter.connect(creator).setServiceFeeAddress(creator.address)
      ).to.be.revertedWith(
        `AccessControl: account ${creator.address.toLowerCase()} is missing role 0xfc425f2263d0df187444b70e47283d622c70181c5baebb1306a01edba1ce184c`
      );
    });

    it("allows deployer owner to change fee params", async () => {
      await cloneWithFixedPriceSequentialMinter();

      await simpleMinter.connect(signer).setServiceFeeBasisPoints(5000);
      await simpleMinter
        .connect(signer)
        .setServiceFeeAddress("0x1234567812345678123456781234567812345678");

      await simpleMinter.connect(user1).mint(8, { value: TOKEN_PRICE.mul(8) });
      await simpleMinter.release(timelock.address);
      await simpleMinter.release(creator.address);

      expect(
        await ethers.provider.getBalance(
          "0x1234567812345678123456781234567812345678"
        )
      ).to.equal(TOKEN_PRICE.mul(8).div(2));
    });

    it("allows deployer owner to set fees to zero", async () => {
      await cloneWithFixedPriceSequentialMinter();

      await simpleMinter.connect(signer).setServiceFeeBasisPoints(0);
      await simpleMinter.connect(user1).mint(8, { value: TOKEN_PRICE.mul(8) });
      await expect(
        await simpleMinter.release(timelock.address)
      ).to.changeEtherBalance(
        timelock,
        TOKEN_PRICE.mul(8).mul(DAO_SHARES).div(TOTAL_SHARES)
      );
      await expect(
        await simpleMinter.release(creator.address)
      ).to.changeEtherBalance(
        creator,
        TOKEN_PRICE.mul(8).mul(FOUNDER_SHARES).div(TOTAL_SHARES)
      );
    });

    it("allows deployer owner to change default service fee and address", async () => {
      await expect(deployer.connect(signer).setServiceFeeAddress(user3.address))
        .to.emit(deployer, "ServiceFeeAddressUpdated")
        .withArgs(user3.address);

      await expect(deployer.connect(signer).setServiceFeeBasisPoints(1234))
        .to.emit(deployer, "ServiceFeeBasisPointsUpdated")
        .withArgs(1234);

      await cloneWithFixedPriceSequentialMinter();

      expect(await simpleMinter.getServiceFeeAddress()).to.equal(user3.address);
      expect(await simpleMinter.getServiceFeeBasisPoints()).to.equal(1234);
    });

    it("doesn't let non deployer owners to change default service fee params", async () => {
      await expect(
        deployer.connect(user3).setServiceFeeAddress(user3.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");

      await expect(
        deployer.connect(user3).setServiceFeeBasisPoints(11)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });
});
