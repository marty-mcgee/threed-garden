import chai from "chai";
import { ethers } from "hardhat";
import { solidity } from "ethereum-waffle";
import { PaymentSplitterWithFeeUpgradeableDerived__factory } from "../typechain/factories/PaymentSplitterWithFeeUpgradeableDerived__factory";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { parseEther } from "ethers/lib/utils";
import { PaymentSplitterWithFeeUpgradeableDerived } from "../typechain/PaymentSplitterWithFeeUpgradeableDerived";
import { BigNumber } from "ethers";

chai.use(solidity);
const { expect } = chai;

describe("PaymentSplitterWithFeeUpgradeable", async () => {
  let snapshotId: number;
  let deployer: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let serviceProvider: SignerWithAddress;
  let paymentSplitterWithFee: PaymentSplitterWithFeeUpgradeableDerived;
  const serviceFeeBasisPoints = 1000; // = 10%

  beforeEach(async () => {
    snapshotId = await ethers.provider.send("evm_snapshot", []);
  });

  afterEach(async () => {
    await ethers.provider.send("evm_revert", [snapshotId]);
  });

  before(async () => {
    [deployer, user1, user2, serviceProvider] = await ethers.getSigners();
  });

  const deployPaymentSplitter = async (fee = serviceFeeBasisPoints) => {
    paymentSplitterWithFee =
      await new PaymentSplitterWithFeeUpgradeableDerived__factory(
        deployer
      ).deploy();

    await paymentSplitterWithFee.initialize(
      [user1.address, user2.address],
      [10, 20],
      serviceProvider.address,
      fee
    );
  };

  it("sends service fee when releasing funds", async () => {
    await deployPaymentSplitter();

    const initialBalance = parseEther("3");
    await deployer.sendTransaction({
      to: paymentSplitterWithFee.address,
      value: initialBalance,
    });

    let user1Eth = initialBalance.mul(10).div(30);
    let user1Fee = user1Eth.mul(serviceFeeBasisPoints).div(10000);

    await expect(
      await paymentSplitterWithFee.release(user1.address)
    ).to.changeEtherBalances(
      [user1, serviceProvider],
      [user1Eth.sub(user1Fee), user1Fee]
    );

    let user2Eth = initialBalance.mul(20).div(30);
    let user2Fee = user2Eth.mul(serviceFeeBasisPoints).div(10000);

    await expect(
      await paymentSplitterWithFee.release(user2.address)
    ).to.changeEtherBalances(
      [user2, serviceProvider],
      [user2Eth.sub(user2Fee), user2Fee]
    );
  });

  it("emits event", async () => {
    await deployPaymentSplitter();

    const initialBalance = parseEther("3");
    await deployer.sendTransaction({
      to: paymentSplitterWithFee.address,
      value: initialBalance,
    });

    let user1Eth = initialBalance.mul(10).div(30);
    let user1Fee = user1Eth.mul(serviceFeeBasisPoints).div(10000);

    await expect(paymentSplitterWithFee.release(user1.address))
      .to.emit(paymentSplitterWithFee, "PaymentReleased")
      .withArgs(user1.address, user1Eth, user1Fee);
  });

  it("doesn't allow initalizing with fee more than 10000", async () => {
    await expect(deployPaymentSplitter(10001)).to.be.revertedWith(
      "Max fee: 10000"
    );
  });

  it("doesn't allow changing the fee to higher than 10000", async () => {
    await deployPaymentSplitter(1000);

    await expect(
      paymentSplitterWithFee.setServiceFeeBasisPoints(10001)
    ).to.be.revertedWith("Max fee: 10000");
  });

  it("sends payment only to fee if set to 10000", async () => {
    await deployPaymentSplitter(10000);

    const initialBalance = parseEther("3");
    await deployer.sendTransaction({
      to: paymentSplitterWithFee.address,
      value: initialBalance,
    });

    let user1Eth = initialBalance.mul(10).div(30);

    await expect(
      await paymentSplitterWithFee.release(user1.address)
    ).to.changeEtherBalances([user1, serviceProvider], [0, user1Eth]);

    let user2Eth = initialBalance.mul(20).div(30);

    await expect(
      await paymentSplitterWithFee.release(user2.address)
    ).to.changeEtherBalances([user2, serviceProvider], [0, user2Eth]);
  });

  it("sends no fee if set to zero", async () => {
    await deployPaymentSplitter(0);

    const initialBalance = parseEther("3");
    await deployer.sendTransaction({
      to: paymentSplitterWithFee.address,
      value: initialBalance,
    });

    let user1Eth = initialBalance.mul(10).div(30);

    await expect(
      await paymentSplitterWithFee.release(user1.address)
    ).to.changeEtherBalances([user1, serviceProvider], [user1Eth, 0]);

    let user2Eth = initialBalance.mul(20).div(30);

    await expect(
      await paymentSplitterWithFee.release(user2.address)
    ).to.changeEtherBalances([user2, serviceProvider], [user2Eth, 0]);
  });

  it("sends correct amount with manual numbers checks", async () => {
    await deployPaymentSplitter(333);

    const initialBalance = parseEther("3");
    await deployer.sendTransaction({
      to: paymentSplitterWithFee.address,
      value: initialBalance,
    });

    expect(
      await ethers.provider.getBalance(paymentSplitterWithFee.address)
    ).to.equal(BigNumber.from("3000000000000000000"));

    let user1Eth = initialBalance.mul(10).div(30);
    expect(user1Eth).to.equal(BigNumber.from("1000000000000000000"));

    const expectedFee = BigNumber.from("33300000000000000");
    const expectedUserPart = BigNumber.from("966700000000000000");

    await expect(
      await paymentSplitterWithFee.release(user1.address)
    ).to.changeEtherBalances(
      [user1, serviceProvider],
      [expectedUserPart, expectedFee]
    );
  });
});
