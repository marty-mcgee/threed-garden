import chai from "chai";
import { ethers } from "hardhat";
import { solidity } from "ethereum-waffle";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ERC721DAOToken, ERC721DAOToken__factory } from "../typechain";
import { RequiredNFTsMintingFilter } from "../typechain/RequiredNFTsMintingFilter";
import { RequiredNFTsMintingFilter__factory } from "../typechain/factories/RequiredNFTsMintingFilter__factory";
import { initToken } from "./utils";

chai.use(solidity);
const { expect } = chai;

describe("RequiredNFTsMintingFilter", async () => {
  let filter: RequiredNFTsMintingFilter;
  let signer: SignerWithAddress;
  let snapshotId: number;
  let tokens: ERC721DAOToken[] = [];
  let minter: SignerWithAddress;
  let creator: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  beforeEach(async () => {
    snapshotId = await ethers.provider.send("evm_snapshot", []);
  });

  afterEach(async () => {
    await ethers.provider.send("evm_revert", [snapshotId]);
  });

  before(async () => {
    [signer, minter, creator, user1, user2] = await ethers.getSigners();

    tokens.push(await new ERC721DAOToken__factory(signer).deploy());
    initToken(tokens[0], signer.address, undefined, minter.address);

    tokens.push(await new ERC721DAOToken__factory(signer).deploy());
    initToken(tokens[1], signer.address, undefined, minter.address);

    filter = await new RequiredNFTsMintingFilter__factory(signer).deploy();
    await filter.initialize(
      creator.address,
      [tokens[0].address, tokens[1].address],
      [1, 2]
    );
  });

  it("reverts if initialized with wrong arity", async () => {
    const otherFilter = await new RequiredNFTsMintingFilter__factory(
      signer
    ).deploy();

    await expect(
      otherFilter.initialize(creator.address, [tokens[0].address], [1, 2])
    ).to.be.revertedWith(
      "NFTsMintingFilter: tokens and minBalances arity mismatch"
    );
  });

  it("returns true for a user with sufficient balances", async () => {
    await tokens[0].connect(minter).mint(user1.address, 1);
    await tokens[1].connect(minter).mint(user1.address, 1);
    await tokens[1].connect(minter).mint(user1.address, 2);

    expect(await filter.meetsRequirements(user1.address)).to.be.true;
  });

  it("returns false for a user with sufficient balance in only one token", async () => {
    await tokens[1].connect(minter).mint(user1.address, 1);
    await tokens[1].connect(minter).mint(user1.address, 2);

    expect(await filter.meetsRequirements(user1.address)).to.be.false;
  });

  it("returns false for a user with insufficient balances in both tokens", async () => {
    await tokens[1].connect(minter).mint(user1.address, 1);

    expect(await filter.meetsRequirements(user1.address)).to.be.false;
  });

  it("block non-creators from setting token filters", async () => {
    await expect(
      filter.connect(user1).setTokenFilters([tokens[0].address], [3])
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("lets creator set token filters", async () => {
    await filter.connect(creator).setTokenFilters([tokens[0].address], [4]);

    const newFilters = await filter.getTokenFilters();
    expect(newFilters.length).to.equal(1);
    expect(newFilters[0].token).to.equal(tokens[0].address);
    expect(newFilters[0].minBalance).to.equal(4);
  });
});
