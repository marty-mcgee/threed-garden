import { ContractFactory } from "ethers";

export async function deployContract(factory: ContractFactory, name: string) {
  const contract = await factory.deploy();
  await contract.deployed();
  console.log("%s deployed to: %s", name, contract.address);
  return contract;
}
