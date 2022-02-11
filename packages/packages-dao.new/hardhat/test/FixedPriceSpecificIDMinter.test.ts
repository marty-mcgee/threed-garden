import chai from "chai";
import { ethers } from "hardhat";
import { solidity } from "ethereum-waffle";
import { deployToken, initToken, CREATOR_ROLE, deployIDMinter } from "./utils";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ERC721DAOToken, FixedPriceSpecificIDMinter } from "../typechain";
import { BigNumberish } from "@ethersproject/bignumber";

chai.use(solidity);
const { expect } = chai;

const MAX_TOKENS = 10;
const TOKEN_PRICE_ETH = 0.1;
const TOKEN_PRICE = ethers.utils.parseEther(TOKEN_PRICE_ETH.toString());
const MAX_MINTS_PER_WALLET = 10;
const STARTING_BLOCK = 1;

describe("FixedPriceSpecificIDMinter", () => {
  let minter: FixedPriceSpecificIDMinter;
  let token: ERC721DAOToken;
  let deployer: SignerWithAddress,
    user: SignerWithAddress,
    user2: SignerWithAddress,
    user3: SignerWithAddress,
    creator: SignerWithAddress;
  let snapshotId: number;

  before(async () => {
    [deployer, user, user2, user3, creator] = await ethers.getSigners();
    token = await deployToken(deployer);

    const payees: string[] = [await deployer.getAddress()];
    const shares: BigNumberish[] = [100];

    minter = await deployIDMinter(
      deployer,
      creator.address,
      token.address,
      MAX_TOKENS,
      TOKEN_PRICE,
      MAX_MINTS_PER_WALLET,
      STARTING_BLOCK,
      payees,
      shares
    );

    await initToken(token, deployer.address, deployer.address, minter.address);
  });

  beforeEach(async () => {
    snapshotId = await ethers.provider.send("evm_snapshot", []);
  });

  afterEach(async () => {
    await ethers.provider.send("evm_revert", [snapshotId]);
  });

  it("does not let init be called again", async () => {
    await expect(
      minter.connect(deployer).init(MAX_TOKENS, TOKEN_PRICE)
    ).to.be.revertedWith("Initializable: contract is not initializing");
  });

  describe("Before sale is active", async () => {
    it("should not allow minting", async () => {
      await expect(
        minter.connect(user).mint(0, { value: TOKEN_PRICE })
      ).to.be.revertedWith("Pausable: paused");
    });
  });

  describe("Mint after sale is active", async () => {
    before(async () => {
      await minter.connect(creator).unpause();
    });

    it("should mint assets", async () => {
      await minter.connect(user).mint(0, { value: TOKEN_PRICE });
      await minter.connect(user).mint(1, { value: TOKEN_PRICE });
      await minter.connect(user).mint(2, { value: TOKEN_PRICE });

      expect(await token.ownerOf(0)).equals(user.address);
      expect(await token.ownerOf(1)).equals(user.address);
      expect(await token.ownerOf(2)).equals(user.address);
    });

    it("should mint assets for multiple users", async () => {
      await minter.connect(user).mint(0, { value: TOKEN_PRICE });
      await minter.connect(user2).mint(1, { value: TOKEN_PRICE });
      await minter.connect(user2).mint(2, { value: TOKEN_PRICE });
      await minter.connect(user3).mint(3, { value: TOKEN_PRICE });

      expect(await token.ownerOf(0)).equals(user.address);
      expect(await token.ownerOf(1)).equals(user2.address);
      expect(await token.ownerOf(2)).equals(user2.address);
      expect(await token.ownerOf(3)).equals(user3.address);
    });

    it("wont mint what's already been minted", async () => {
      await minter.connect(user).mint(0, { value: TOKEN_PRICE });

      await expect(
        minter.connect(user).mint(0, { value: TOKEN_PRICE })
      ).to.be.revertedWith("ERC721: token already minted");
    });

    it("wont exceed max supply", async () => {
      for (let i = 0; i < MAX_TOKENS; i++) {
        await minter.connect(user).mint(i, { value: TOKEN_PRICE });
      }

      await expect(
        minter.connect(user).mint(MAX_TOKENS, { value: TOKEN_PRICE })
      ).to.be.revertedWith(
        "FixedPriceFixedSupplyMinter: Minting this many would exceed supply!"
      );
    });

    it("should not mint given insufficient funds", async () => {
      const insufficientValue = TOKEN_PRICE_ETH * 0.9;
      await expect(
        minter.connect(user).mint(0, {
          value: ethers.utils.parseEther(insufficientValue.toString()),
        })
      ).to.be.revertedWith(
        "FixedPriceSpecificIDMinter: not enough ether sent!"
      );
    });

    it("should not mint before starting block", async () => {
      await minter
        .connect(creator)
        .setStartingBlock(ethers.provider.blockNumber + 1000);

      await expect(
        minter.connect(user).mint(0, {
          value: TOKEN_PRICE,
        })
      ).to.be.revertedWith("ERC721Minter: Sale hasn't started yet!");
    });
  });

  describe("Starting Block", async () => {
    it("should allow the creator to set the starting block", async () => {
      const newValue = STARTING_BLOCK + 123;

      await minter.connect(creator).setStartingBlock(newValue);

      expect((await minter.startingBlock()).toNumber()).equals(newValue);
    });

    it("should prevent non-creators from setting starting block", async () => {
      expect(await minter.hasRole(CREATOR_ROLE, user2.address)).to.be.false;

      await expect(
        minter.connect(user2).setStartingBlock(STARTING_BLOCK + 123)
      ).to.be.revertedWith(
        `AccessControl: account ${user2.address.toLowerCase()} is missing role 0x828634d95e775031b9ff576b159a8509d3053581a8c9c4d7d86899e0afcd882f`
      );
    });
  });

  describe("Owner Mint", async () => {
    it("should mint to the to address", async () => {
      await minter.connect(creator).ownerMint(user.address, 2);

      expect(await token.ownerOf(2)).equals(user.address);
    });

    it("should not allow non owners to mint", async () => {
      await expect(
        minter.connect(user).ownerMint(user.address, 5)
      ).to.be.revertedWith(
        `AccessControl: account ${user.address.toLowerCase()} is missing role 0x828634d95e775031b9ff576b159a8509d3053581a8c9c4d7d86899e0afcd882f`
      );
    });

    it("should not allow minting more than max supply", async () => {
      for (let i = 0; i < MAX_TOKENS; i++) {
        minter.connect(user).mint(i, { value: TOKEN_PRICE });
      }

      await expect(
        minter.connect(creator).ownerMint(user.address, MAX_TOKENS)
      ).to.be.revertedWith(
        "FixedPriceFixedSupplyMinter: Minting this many would exceed supply!"
      );
    });

    it("should let creator lock, then prevent further owner mints", async () => {
      await minter.connect(creator).lockOwnerMint();

      await expect(
        minter.connect(creator).ownerMint(user.address, 1)
      ).to.be.revertedWith("FixedPriceSpecificIDMinter: ownerMint is locked");
    });
  });
});
