import chai from "chai";
import { ethers } from "hardhat";
import { solidity } from "ethereum-waffle";
import {
  deployToken,
  deployFixedPriceSequentialMinter,
  initToken,
  CREATOR_ROLE,
} from "./utils";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { FixedPriceSequentialMinter, ERC721DAOToken } from "../typechain";
import { BigNumberish } from "@ethersproject/bignumber";

chai.use(solidity);
const { expect } = chai;

const MAX_TOKENS = 10;
const TOKEN_PRICE_ETH = 0.1;
const TOKEN_PRICE = ethers.utils.parseEther(TOKEN_PRICE_ETH.toString());
const MAX_MINTS_PER_TX = 10;
const STARTING_BLOCK = 1;

describe("FixedPriceSequentialMinter", () => {
  let minter: FixedPriceSequentialMinter;
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

    minter = await deployFixedPriceSequentialMinter(
      deployer,
      creator.address,
      token.address,
      MAX_TOKENS,
      TOKEN_PRICE,
      MAX_MINTS_PER_TX,
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
      minter.connect(deployer).init(MAX_TOKENS, TOKEN_PRICE, MAX_MINTS_PER_TX)
    ).to.be.revertedWith("Initializable: contract is not initializing");
  });

  describe("Before sale is active", async () => {
    it("should not allow minting", async () => {
      await expect(
        minter.connect(user).mint(1, { value: TOKEN_PRICE })
      ).to.be.revertedWith("Pausable: paused");
    });
  });

  describe("Mint after sale is active", async () => {
    before(async () => {
      await minter.connect(creator).unpause();
    });

    it("should mint an asset", async () => {
      await minter.connect(user).mint(1, {
        value: TOKEN_PRICE,
      });

      expect(await token.ownerOf(1)).equals(user.address);
    });

    it("should mint multiple assets", async () => {
      await minter.connect(user).mint(3, {
        value: ethers.utils.parseEther((TOKEN_PRICE_ETH * 3).toString()),
      });

      expect(await token.ownerOf(1)).equals(user.address);
      expect(await token.ownerOf(2)).equals(user.address);
      expect(await token.ownerOf(3)).equals(user.address);
    });

    it("should mint multiple assets for multiple users", async () => {
      await minter.connect(user).mint(1, {
        value: TOKEN_PRICE,
      });
      await minter.connect(user2).mint(2, {
        value: ethers.utils.parseEther((TOKEN_PRICE_ETH * 2).toString()),
      });
      await minter.connect(user3).mint(1, {
        value: TOKEN_PRICE,
      });

      expect(await token.ownerOf(1)).equals(user.address);
      expect(await token.ownerOf(2)).equals(user2.address);
      expect(await token.ownerOf(3)).equals(user2.address);
      expect(await token.ownerOf(4)).equals(user3.address);
    });

    describe("max mints per tx", async () => {
      it("wont mint too many at once", async () => {
        const numToMint = MAX_MINTS_PER_TX + 1;

        await expect(
          minter.connect(user).mint(MAX_MINTS_PER_TX + 1, {
            value: ethers.utils.parseEther(
              (TOKEN_PRICE_ETH * numToMint).toString()
            ),
          })
        ).to.be.reverted;
      });

      it("allows creator to change max mints per tx", async () => {
        // allows minting 3 be default
        await minter.connect(user).mint(4, { value: TOKEN_PRICE.mul(4) });

        await minter.connect(creator).setMaxMintsPerTx(3);

        await minter.connect(user).mint(3, { value: TOKEN_PRICE.mul(3) });
        await expect(
          minter.connect(user).mint(4, { value: TOKEN_PRICE.mul(4) })
        ).to.be.reverted;
      });

      it("doesn't allow non creator to change max mints per tx", async () => {
        await expect(
          minter.connect(user).setMaxMintsPerTx(3)
        ).to.be.revertedWith(
          `AccessControl: account ${user.address.toLowerCase()} is missing role 0x828634d95e775031b9ff576b159a8509d3053581a8c9c4d7d86899e0afcd882`
        );
      });
    });

    it("wont exceed max supply", async () => {
      await minter.connect(user).mint(9, {
        value: ethers.utils.parseEther((TOKEN_PRICE_ETH * 9).toString()),
      });

      await expect(
        minter.connect(user).mint(2, {
          value: ethers.utils.parseEther((TOKEN_PRICE_ETH * 2).toString()),
        })
      ).to.be.revertedWith(
        "FixedPriceFixedSupplyMinter: Minting this many would exceed supply!"
      );
    });

    it("should not mint given insufficient funds", async () => {
      await expect(
        minter.connect(user).mint(3, {
          value: ethers.utils.parseEther((TOKEN_PRICE_ETH * 2).toString()),
        })
      ).to.be.revertedWith(
        "FixedPriceSequentialMinter: not enough ether sent!"
      );
    });

    it("should not mint before starting block", async () => {
      await minter
        .connect(creator)
        .setStartingBlock(ethers.provider.blockNumber + 1000);

      await expect(
        minter.connect(user).mint(3, {
          value: ethers.utils.parseEther((TOKEN_PRICE_ETH * 3).toString()),
        })
      ).to.be.revertedWith("ERC721Minter: Sale hasn't started yet!");
    });
  });

  describe("Owner Mint", async () => {
    it("should mint to the to address", async () => {
      await minter.connect(creator).ownerMint(user.address, 2);

      expect(await token.ownerOf(1)).equals(user.address);
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
      minter.connect(user).mint(MAX_TOKENS, {
        value: ethers.utils.parseEther(
          (TOKEN_PRICE_ETH * MAX_TOKENS).toString()
        ),
      });

      await expect(
        minter.connect(creator).ownerMint(user.address, 1)
      ).to.be.revertedWith(
        "FixedPriceFixedSupplyMinter: Minting this many would exceed supply!"
      );
    });

    it("should let creator lock, then prevent further owner mints", async () => {
      await minter.connect(creator).lockOwnerMint();

      await expect(
        minter.connect(creator).ownerMint(user.address, 1)
      ).to.be.revertedWith("FixedPriceSequentialMinter: ownerMint is locked");
    });
  });

  describe("ERC721Minter", async () => {
    describe("Starting Block", async () => {
      it("should allow the creator to set the starting block", async () => {
        const newValue = STARTING_BLOCK + 123;

        await minter.connect(creator).setStartingBlock(newValue);

        expect((await minter.startingBlock()).toNumber()).equals(newValue);
      });

      it("should prevent the creator from setting the starting block once it's locked", async () => {
        await minter.connect(creator).lockStartingBlock();

        await expect(
          minter.connect(creator).setStartingBlock(STARTING_BLOCK + 123)
        ).to.revertedWith("ERC721Minter: startingBlock is locked");
      });

      it("should prevent non-creators from setting starting block", async () => {
        expect(await minter.hasRole(CREATOR_ROLE, user2.address)).to.be.false;

        await expect(
          minter.connect(user2).setStartingBlock(STARTING_BLOCK + 123)
        ).to.be.revertedWith(
          `AccessControl: account ${user2.address.toLowerCase()} is missing role 0x828634d95e775031b9ff576b159a8509d3053581a8c9c4d7d86899e0afcd882f`
        );
      });

      it("should prevent non-creators from locking starting block", async () => {
        expect(await minter.hasRole(CREATOR_ROLE, user2.address)).to.be.false;

        await expect(
          minter.connect(user2).lockStartingBlock()
        ).to.be.revertedWith(
          `AccessControl: account ${user2.address.toLowerCase()} is missing role 0x828634d95e775031b9ff576b159a8509d3053581a8c9c4d7d86899e0afcd882f`
        );
      });
    });

    describe("service fee", async () => {
      it("emits event when deployer changes service fee", async () => {
        await expect(minter.connect(deployer).setServiceFeeBasisPoints(1234))
          .to.emit(minter, "ServiceFeeBasisPointsUpdated")
          .withArgs(1234);
      });

      it("emits event when changing service fee address", async () => {
        const address = "0x8888888888888888888888888888888888888888";
        await expect(minter.connect(deployer).setServiceFeeAddress(address))
          .to.emit(minter, "ServiceFeeAddressUpdated")
          .withArgs(address);
      });
    });
  });

  describe("FixedPriceFixedSupplyMinter", async () => {
    describe("Owner Mint Lock", async () => {
      it("should let creator lock", async () => {
        expect(await minter.isOwnerMintLocked()).to.be.false;

        await minter.connect(creator).lockOwnerMint();

        expect(await minter.isOwnerMintLocked()).to.be.true;
      });

      it("should block non-creators from locking", async () => {
        await expect(minter.connect(user3).lockOwnerMint()).to.be.revertedWith(
          `AccessControl: account ${user3.address.toLowerCase()} is missing role 0x828634d95e775031b9ff576b159a8509d3053581a8c9c4d7d86899e0afcd882f`
        );
      });
    });

    describe("Max Tokens", async () => {
      it("should let creator set", async () => {
        const newValue = MAX_TOKENS + 123;

        await minter.connect(creator).setMaxTokens(newValue);

        expect(await minter.maxTokens()).to.equal(newValue);
      });

      it("should block non-creators from setting", async () => {
        const newValue = MAX_TOKENS + 123;

        await expect(
          minter.connect(user3).setMaxTokens(newValue)
        ).to.be.revertedWith(
          `AccessControl: account ${user3.address.toLowerCase()} is missing role 0x828634d95e775031b9ff576b159a8509d3053581a8c9c4d7d86899e0afcd882f`
        );
      });

      it("should let creator lock, and block setting once locked", async () => {
        await minter.connect(creator).lockMaxTokens();
        expect(await minter.isMaxTokensLocked()).to.be.true;

        await expect(
          minter.connect(creator).setMaxTokens(1234)
        ).to.be.revertedWith(
          "FixedPriceFixedSupplyMinter: maxTokens is locked"
        );
      });

      it("should block non-creators from locking", async () => {
        await expect(minter.connect(user3).lockMaxTokens()).to.be.revertedWith(
          `AccessControl: account ${user3.address.toLowerCase()} is missing role 0x828634d95e775031b9ff576b159a8509d3053581a8c9c4d7d86899e0afcd882f`
        );
      });
    });

    describe("Token Price", async () => {
      it("should let creator set", async () => {
        const newValue = TOKEN_PRICE.add(4321);

        await minter.connect(creator).setTokenPrice(newValue);

        expect(await minter.tokenPrice()).to.equal(newValue);
      });

      it("should block non-creators from setting", async () => {
        const newValue = TOKEN_PRICE.add(4321);

        await expect(
          minter.connect(user3).setTokenPrice(newValue)
        ).to.be.revertedWith(
          `AccessControl: account ${user3.address.toLowerCase()} is missing role 0x828634d95e775031b9ff576b159a8509d3053581a8c9c4d7d86899e0afcd882f`
        );
      });

      it("should let creator lock, and block setting once locked", async () => {
        await minter.connect(creator).lockTokenPrice();
        expect(await minter.isTokenPriceLocked()).to.be.true;

        await expect(
          minter.connect(creator).setTokenPrice(1234)
        ).to.be.revertedWith(
          "FixedPriceFixedSupplyMinter: tokenPrice is locked"
        );
      });

      it("should block non-creators from locking", async () => {
        await expect(minter.connect(user3).lockTokenPrice()).to.be.revertedWith(
          `AccessControl: account ${user3.address.toLowerCase()} is missing role 0x828634d95e775031b9ff576b159a8509d3053581a8c9c4d7d86899e0afcd882f`
        );
      });
    });
  });
});
