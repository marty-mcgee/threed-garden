import chai from "chai";
import { ethers } from "hardhat";
import { solidity } from "ethereum-waffle";
import {
  deployToken,
  initToken,
  deployGovernor,
  deployTimelock,
  propose,
  advanceBlocks,
  hashString,
  setNextBlockTimestamp,
  ProposalInfo,
  proposeAndExecute,
  createTransferProp,
} from "./utils";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ERC721DAOToken, ERC721Governor, ERC721Timelock } from "../typechain";

chai.use(solidity);
const { expect } = chai;

const zeroAddress = "0x0000000000000000000000000000000000000000";

const PROP_THRESHOLD = 2;
const VOTING_DELAY = 1;
const VOTING_PERIOD = 100;
const QUORUM_NUMERATOR = 1;

describe("ERC721Governor", () => {
  let governor: ERC721Governor;
  let token: ERC721DAOToken;
  let timelock: ERC721Timelock;
  let deployer: SignerWithAddress,
    user: SignerWithAddress,
    user2: SignerWithAddress,
    user3: SignerWithAddress;
  let snapshotId: number;

  before(async () => {
    [deployer, user, user2, user3] = await ethers.getSigners();

    token = await deployToken(deployer);
    governor = await deployGovernor(deployer);
    timelock = await deployTimelock(deployer);

    await initToken(
      token,
      deployer.address,
      deployer.address,
      deployer.address
    );

    timelock.initialize(1, [governor.address], [zeroAddress]);

    await governor.initialize(
      "MyDAO",
      token.address,
      timelock.address,
      PROP_THRESHOLD,
      VOTING_DELAY,
      VOTING_PERIOD,
      QUORUM_NUMERATOR
    );

    await token.connect(user).delegate(user.address);
    await token.connect(user2).delegate(user2.address);
    await token.connect(user3).delegate(user3.address);
  });

  beforeEach(async () => {
    snapshotId = await ethers.provider.send("evm_snapshot", []);
  });

  afterEach(async () => {
    await ethers.provider.send("evm_revert", [snapshotId]);
  });

  describe("Proposal Threshold", async () => {
    it("blocks proposals below threshold", async () => {
      await token.connect(deployer).mint(user.address, PROP_THRESHOLD - 1);
      const transferProp = await createTransferProp(user3.address, 123);

      await expect(
        governor
          .connect(user)
          .propose(
            transferProp.targets,
            transferProp.values,
            transferProp.callDatas,
            transferProp.description
          )
      ).to.revertedWith(
        "GovernorCompatibilityBravo: proposer votes below proposal threshold"
      );
    });

    it("supports proposal threshold update via proposals", async () => {
      for (let i = 0; i < PROP_THRESHOLD; i++) {
        await token.connect(deployer).mint(user.address, i);
      }
      // minting more because set threshold doesn't let you set it above the total supply
      // this amount should be gte to the threshold change
      await token.connect(deployer).mint(user2.address, 2);

      const newThreshold = PROP_THRESHOLD + 1;

      const funcData = governor.interface.encodeFunctionData(
        "setProposalThreshold",
        [newThreshold]
      );
      const description = "description";
      const propInfo: ProposalInfo = {
        targets: [governor.address],
        values: [0],
        callDatas: [funcData],
        description: description,
        descriptionHash: hashString(description),
      };

      const receipt = await proposeAndExecute(user, governor, propInfo);

      expect(await governor.proposalThreshold()).to.be.equal(newThreshold);

      const event = receipt.events?.find(
        (e) => e.event == "ProposalThresholdSet"
      );
      expect(event?.args?.newProposalThreshold.toNumber()).equals(newThreshold);
    });

    it("block proposal threshold update if it exceeds total token supply", async () => {
      for (let i = 0; i < PROP_THRESHOLD; i++) {
        await token.connect(deployer).mint(user.address, i);
      }

      const newThreshold = (await token.totalSupply()).toNumber() + 1;

      const funcData = governor.interface.encodeFunctionData(
        "setProposalThreshold",
        [newThreshold]
      );
      const description = "description";
      const propInfo: ProposalInfo = {
        targets: [governor.address],
        values: [0],
        callDatas: [funcData],
        description: description,
        descriptionHash: hashString(description),
      };

      // Not asserting the ERC721Governor::setProposalThreshold reason here, because Timelock
      // doesn't bubble up specific error messages
      await expect(
        proposeAndExecute(user, governor, propInfo)
      ).to.be.revertedWith(
        "TimelockController: underlying transaction reverted"
      );
    });

    it("blocks random callers to setProposalThreshold", async () => {
      await expect(governor.setProposalThreshold(0)).to.be.revertedWith(
        "Governor: onlyGovernance"
      );
    });
  });

  describe("Voting Delay", async () => {
    it("blocks random callers from setting voting delay", async () => {
      await expect(governor.setVotingDelay(0)).to.be.revertedWith(
        "Governor: onlyGovernance"
      );
    });

    it("allows setting voting delay using a proposal", async () => {
      const newDelay = VOTING_DELAY + 123;
      const funcData = governor.interface.encodeFunctionData("setVotingDelay", [
        newDelay,
      ]);
      const description = "description";
      const propInfo: ProposalInfo = {
        targets: [governor.address],
        values: [0],
        callDatas: [funcData],
        description: description,
        descriptionHash: hashString(description),
      };
      for (let i = 0; i < PROP_THRESHOLD; i++) {
        await token.connect(deployer).mint(user.address, i);
      }

      const receipt = await proposeAndExecute(user, governor, propInfo);

      expect((await governor.votingDelay()).toNumber()).equals(newDelay);

      const event = receipt.events?.find((e) => e.event == "VotingDelaySet");
      expect(event?.args?.newVotingDelay.toNumber()).equals(newDelay);
    });
  });

  describe("Voting Period", async () => {
    it("blocks random callers from setting voting period", async () => {
      await expect(governor.setVotingPeriod(0)).to.be.revertedWith(
        "Governor: onlyGovernance"
      );
    });

    it("allows setting voting period using a proposal", async () => {
      const newPeriod = VOTING_PERIOD + 123;
      const funcData = governor.interface.encodeFunctionData(
        "setVotingPeriod",
        [newPeriod]
      );
      const description = "description";
      const propInfo: ProposalInfo = {
        targets: [governor.address],
        values: [0],
        callDatas: [funcData],
        description: description,
        descriptionHash: hashString(description),
      };
      for (let i = 0; i < PROP_THRESHOLD; i++) {
        await token.connect(deployer).mint(user.address, i);
      }

      const receipt = await proposeAndExecute(user, governor, propInfo);

      expect((await governor.votingPeriod()).toNumber()).equals(newPeriod);

      const event = receipt.events?.find((e) => e.event == "VotingPeriodSet");
      expect(event?.args?.newVotingPeriod.toNumber()).equals(newPeriod);
    });
  });

  describe("Quorum Numerator", async () => {
    it("blocks random callers from setting quorum numerator", async () => {
      await expect(governor.updateQuorumNumerator(0)).to.be.revertedWith(
        "Governor: onlyGovernance"
      );
    });

    it("allows setting quorum numerator using a proposal", async () => {
      const newValue = QUORUM_NUMERATOR + 12;
      const funcData = governor.interface.encodeFunctionData(
        "updateQuorumNumerator",
        [newValue]
      );
      const description = "description";
      const propInfo: ProposalInfo = {
        targets: [governor.address],
        values: [0],
        callDatas: [funcData],
        description: description,
        descriptionHash: hashString(description),
      };
      for (let i = 0; i < PROP_THRESHOLD; i++) {
        await token.connect(deployer).mint(user.address, i);
      }

      const receipt = await proposeAndExecute(user, governor, propInfo);

      expect((await governor.quorumNumerator()).toNumber()).equals(newValue);

      const event = receipt.events?.find(
        (e) => e.event == "QuorumNumeratorUpdated"
      );
      expect(event?.args?.newQuorumNumerator.toNumber()).equals(newValue);
    });
  });
});
