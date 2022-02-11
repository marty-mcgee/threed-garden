import { task } from "hardhat/config";
import { SVGPlaceholder__factory } from "../typechain";
import { deployContract } from "./deploy-utils";

task("deploy-svg-placeholder", "Deploy the SVGPlaceholder contract").setAction(
  async (args, { ethers }) => {
    const [deployer] = await ethers.getSigners();

    await deployContract(
      new SVGPlaceholder__factory(deployer),
      "SVGPlaceholder"
    );
  }
);
