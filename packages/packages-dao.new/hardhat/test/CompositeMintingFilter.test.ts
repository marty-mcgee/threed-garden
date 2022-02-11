import chai from "chai";
import { ethers } from "hardhat";
import { solidity } from "ethereum-waffle";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ERC721DAOToken, ERC721DAOToken__factory } from "../typechain";
import { RejectedNFTsMintingFilter__factory } from "../typechain/factories/RejectedNFTsMintingFilter__factory";
import { CompositeMintingFilter } from "../typechain/CompositeMintingFilter";
import { CompositeMintingFilter__factory } from "../typechain/factories/CompositeMintingFilter__factory";
import { RequiredNFTsMintingFilter__factory } from "../typechain/factories/RequiredNFTsMintingFilter__factory";
import { RequiredNFTsMintingFilter } from "../typechain/RequiredNFTsMintingFilter";
import { RejectedNFTsMintingFilter } from "../typechain/RejectedNFTsMintingFilter";
import { initToken } from "./utils";

chai.use(solidity);
const { expect } = chai;

describe("CompositeMintingFilter", async () => {
  let filter: CompositeMintingFilter;
  let signer: SignerWithAddress;
  let snapshotId: number;
  let requiredToken: ERC721DAOToken;
  let rejectedToken: ERC721DAOToken;
  let minter: SignerWithAddress;
  let creator: SignerWithAddress;
  let user1: SignerWithAddress;
  let requiredFilter: RequiredNFTsMintingFilter;
  let rejectedFilter: RejectedNFTsMintingFilter;

  beforeEach(async () => {
    snapshotId = await ethers.provider.send("evm_snapshot", []);
  });

  afterEach(async () => {
    await ethers.provider.send("evm_revert", [snapshotId]);
  });

  before(async () => {
    [signer, minter, creator, user1] = await ethers.getSigners();

    requiredToken = await new ERC721DAOToken__factory(signer).deploy();
    initToken(requiredToken, signer.address, undefined, minter.address);

    requiredFilter = await new RequiredNFTsMintingFilter__factory(
      signer
    ).deploy();
    await requiredFilter.initialize(
      creator.address,
      [requiredToken.address],
      [1]
    );

    rejectedToken = await new ERC721DAOToken__factory(signer).deploy();
    initToken(rejectedToken, signer.address, undefined, minter.address);

    rejectedFilter = await new RejectedNFTsMintingFilter__factory(
      signer
    ).deploy();
    await rejectedFilter.initialize(
      creator.address,
      [rejectedToken.address],
      [1]
    );

    filter = await new CompositeMintingFilter__factory(signer).deploy();
    await filter.initialize(creator.address, [
      requiredFilter.address,
      rejectedFilter.address,
    ]);
  });

  it("returns true when both filters return true", async () => {
    await requiredToken.connect(minter).mint(user1.address, 1);

    expect(await requiredFilter.meetsRequirements(user1.address)).to.be.true;
    expect(await rejectedFilter.meetsRequirements(user1.address)).to.be.true;

    expect(await filter.meetsRequirements(user1.address)).to.be.true;
  });

  it("returns false when the required token filter returns true, but the rejected token filter returns false", async () => {
    await requiredToken.connect(minter).mint(user1.address, 1);
    await rejectedToken.connect(minter).mint(user1.address, 1);

    expect(await requiredFilter.meetsRequirements(user1.address)).to.be.true;
    expect(await rejectedFilter.meetsRequirements(user1.address)).to.be.false;

    expect(await filter.meetsRequirements(user1.address)).to.be.false;
  });

  it("returns false when the required token filter returns false, but the rejected token filter returns true", async () => {
    // user1's balance is zero in both tokens.
    expect(await requiredFilter.meetsRequirements(user1.address)).to.be.false;
    expect(await rejectedFilter.meetsRequirements(user1.address)).to.be.true;

    expect(await filter.meetsRequirements(user1.address)).to.be.false;
  });

  it("returns false when both filters return false", async () => {
    await rejectedToken.connect(minter).mint(user1.address, 1);

    expect(await requiredFilter.meetsRequirements(user1.address)).to.be.false;
    expect(await rejectedFilter.meetsRequirements(user1.address)).to.be.false;

    expect(await filter.meetsRequirements(user1.address)).to.be.false;
  });
});
