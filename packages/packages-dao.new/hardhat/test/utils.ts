import { ethers, network } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  ERC721DAOToken,
  ERC721DAOToken__factory,
  FixedPriceSequentialMinter__factory,
  ERC721Governor,
  ERC721Governor__factory,
  ERC721Timelock,
  ERC721Timelock__factory,
  FixedPriceSpecificIDMinter__factory,
} from "../typechain";
import { BigNumber, BigNumberish } from "@ethersproject/bignumber";
import { ContractReceipt } from "@ethersproject/contracts";
import { ERC721DAODeployer } from "../typechain/ERC721DAODeployer";
import { ERC721DAODeployer__factory } from "../typechain/factories/ERC721DAODeployer__factory";
import { BytesLike } from "ethers";
import { ITokenURIDescriptor } from "../typechain/ITokenURIDescriptor";
import { SVGPlaceholder__factory } from "../typechain/factories/SVGPlaceholder__factory";

const keccak256 = ethers.utils.keccak256;
const toUtf8Bytes = ethers.utils.toUtf8Bytes;
export const hashString = (str: string) => {
  return keccak256(toUtf8Bytes(str));
};

export const DEFAULT_ADMIN_ROLE = ethers.constants.HashZero;
export const ADMINS_ADMIN_ROLE = hashString("ADMINS_ADMIN_ROLE");
export const MINTER_ROLE = hashString("MINTER_ROLE");
export const MINTER_ADMIN_ROLE = hashString("MINTER_ADMIN_ROLE");
export const BASE_URI_ROLE = hashString("BASE_URI_ROLE");
export const BASE_URI_ADMIN_ROLE = hashString("BASE_URI_ADMIN_ROLE");
export const ROYALTIES_ROLE = hashString("ROYALTIES_ROLE");
export const ROYALTIES_ADMIN_ROLE = hashString("ROYALTIES_ADMIN_ROLE");
export const PROXY_REGISTRY_ROLE = hashString("PROXY_REGISTRY_ROLE");
export const PROXY_REGISTRY_ADMIN_ROLE = hashString(
  "PROXY_REGISTRY_ADMIN_ROLE"
);
export const CREATOR_ROLE = hashString("CREATOR_ROLE");
export const TRANSFERS_ROLE = hashString("TRANSFERS_ROLE");
export const TRANSFERS_ADMIN_ROLE = hashString("TRANSFERS_ADMIN_ROLE");

const zeroAddress = "0x0000000000000000000000000000000000000000";

export const defaultRoles = [
  MINTER_ROLE,
  MINTER_ADMIN_ROLE,
  BASE_URI_ROLE,
  BASE_URI_ADMIN_ROLE,
];

export type TestSigners = {
  deployer: SignerWithAddress;
  account0: SignerWithAddress;
  account1: SignerWithAddress;
  account2: SignerWithAddress;
};

export type ProposalInfo = {
  targets: string[];
  values: BigNumberish[];
  callDatas: BytesLike[];
  description: string;
  descriptionHash: BytesLike;
};

export const encodeParameters = (
  types: string[],
  values: unknown[]
): string => {
  const abi = new ethers.utils.AbiCoder();
  return abi.encode(types, values);
};

export const address = (n: number): string => {
  return `0x${n.toString(16).padStart(40, "0")}`;
};

export const getSigners = async (): Promise<TestSigners> => {
  const [deployer, account0, account1, account2] = await ethers.getSigners();
  return {
    deployer,
    account0,
    account1,
    account2,
  };
};

export const deployToken = async (deployer: SignerWithAddress) => {
  return await new ERC721DAOToken__factory(deployer).deploy();
};

export const deployAndInitDAOToken = async (
  deployer: SignerWithAddress,
  admin?: SignerWithAddress,
  minter?: SignerWithAddress,
  baseURIer?: SignerWithAddress,
  baseURI?: string,
  contractInfoURI?: string
): Promise<ERC721DAOToken> => {
  const token = await new ERC721DAOToken__factory(deployer).deploy();
  const svgPlaceholder = await new SVGPlaceholder__factory(deployer).deploy();

  return await initToken(
    token,
    deployer.address,
    admin?.address,
    minter?.address,
    baseURIer?.address,
    baseURI,
    contractInfoURI,
    svgPlaceholder.address
  );
};

export const attachToken = (
  deployer: SignerWithAddress,
  instance: string
): ERC721DAOToken => {
  return new ERC721DAOToken__factory(deployer).attach(instance);
};

export const deployFixedPriceSequentialMinter = async (
  deployer: SignerWithAddress,
  ownerAddress: string,
  tokenAddress: string,
  maxTokens: BigNumberish,
  tokenPrice: BigNumberish,
  maxMintsPerTx: BigNumberish,
  startingBlock: BigNumberish,
  payees: string[],
  shares: BigNumberish[]
) => {
  const minter = await new FixedPriceSequentialMinter__factory(
    deployer
  ).deploy();

  await minter.initialize(
    ownerAddress,
    tokenAddress,
    startingBlock,
    payees,
    shares,
    zeroAddress,
    minter.interface.encodeFunctionData("init", [
      maxTokens,
      tokenPrice,
      maxMintsPerTx,
    ]),
    zeroAddress,
    0,
    deployer.address
  );

  return minter;
};

export const deployIDMinter = async (
  deployer: SignerWithAddress,
  ownerAddress: string,
  tokenAddress: string,
  maxTokens: BigNumberish,
  tokenPrice: BigNumberish,
  maxMintsPerTx: BigNumberish,
  startingBlock: BigNumberish,
  payees: string[],
  shares: BigNumberish[]
) => {
  const minter = await new FixedPriceSpecificIDMinter__factory(
    deployer
  ).deploy();

  await minter.initialize(
    ownerAddress,
    tokenAddress,
    startingBlock,
    payees,
    shares,
    zeroAddress,
    minter.interface.encodeFunctionData("init", [maxTokens, tokenPrice]),
    zeroAddress,
    0,
    zeroAddress
  );

  return minter;
};

export const deployAndInitDeployer = async (
  deployer: SignerWithAddress,
  token: ERC721DAOToken,
  timelock: ERC721Timelock,
  governor: ERC721Governor,
  minters: string[],
  mintingFilters: string[],
  serviceFeeAddress: string = zeroAddress
): Promise<ERC721DAODeployer> => {
  const instance = await new ERC721DAODeployer__factory(deployer).deploy();
  await instance.initialize(
    token.address,
    timelock.address,
    governor.address,
    minters,
    mintingFilters,
    serviceFeeAddress
  );
  return instance;
};

export const defaultAssignees = async (
  deployer: SignerWithAddress
): Promise<string[]> => {
  const addr = await deployer.getAddress();
  return [addr, addr, addr, addr];
};

export const initToken = async (
  token: ERC721DAOToken,
  deployer: string,
  admin?: string,
  minter?: string,
  baseURIer?: string,
  baseURI: string = "BaseURI",
  contractInfoURI: string = "some contract JSON URI",
  tokenURIDescriptor: string = zeroAddress,
  creator?: string
) => {
  const actualAdmin = admin || deployer;
  const actualMinter = minter || deployer;
  const actualBaseURIer = baseURIer || deployer;
  const actualCreator = creator || deployer;

  const rolesAssignees = [
    actualMinter,
    actualAdmin,
    actualBaseURIer,
    actualAdmin,
  ];

  await token.initialize(
    "AwesomeToken",
    "ASM",
    baseURI,
    contractInfoURI,
    defaultRoles,
    rolesAssignees,
    {
      recipient: ethers.constants.AddressZero,
      bps: 0,
    },
    tokenURIDescriptor,
    actualCreator
  );
  return token;
};

export const deployTimelock = async (
  deployer: SignerWithAddress
): Promise<ERC721Timelock> => {
  return await new ERC721Timelock__factory(deployer).deploy();
};

export const deployGovernor = async (
  deployer: SignerWithAddress
): Promise<ERC721Governor> => {
  return await new ERC721Governor__factory(deployer).deploy();
};

export const deployMinter = async (deployer: SignerWithAddress) => {
  return await new FixedPriceSequentialMinter__factory(deployer).deploy();
};

export const propose = async (
  proposer: SignerWithAddress,
  governor: ERC721Governor,
  propInfo: ProposalInfo
): Promise<BigNumber> => {
  const tx = await governor
    .connect(proposer)
    .propose(
      propInfo.targets,
      propInfo.values,
      propInfo.callDatas,
      propInfo.description
    );
  const receipt = await tx.wait();
  const event = receipt.events?.find((e) => e.event == "ProposalCreated");
  return event?.args?.proposalId;
};

export const proposeAndExecute = async (
  proposer: SignerWithAddress,
  governor: ERC721Governor,
  propInfo: ProposalInfo
): Promise<ContractReceipt> => {
  const proposalId = await propose(proposer, governor, propInfo);
  await advanceBlocks((await governor.votingDelay()).toNumber());

  await governor.connect(proposer).castVote(proposalId, 1);
  await advanceBlocks((await governor.votingPeriod()).toNumber());

  await governor.queue(
    propInfo.targets,
    propInfo.values,
    propInfo.callDatas,
    propInfo.descriptionHash
  );
  const eta = await governor.proposalEta(proposalId);
  await setNextBlockTimestamp(eta.toNumber(), false);

  const tx = await governor.execute(
    propInfo.targets,
    propInfo.values,
    propInfo.callDatas,
    propInfo.descriptionHash
  );

  return await tx.wait();
};

export const createTransferProp = (
  targetAddress: string,
  value: BigNumberish
): ProposalInfo => {
  const description = "description";
  return {
    targets: [targetAddress],
    values: [value],
    callDatas: ["0x"],
    description: description,
    descriptionHash: hashString(description),
  };
};

export const mineBlock = async (): Promise<void> => {
  await network.provider.send("evm_mine");
};

export const advanceBlocks = async (blocks: number): Promise<void> => {
  for (let i = 0; i < blocks; i++) {
    await mineBlock();
  }
};

const rpc = <T = unknown>({
  method,
  params,
}: {
  method: string;
  params?: unknown[];
}): Promise<T> => {
  return network.provider.send(method, params);
};

export const setNextBlockTimestamp = async (
  n: number,
  mine = true
): Promise<void> => {
  await rpc({ method: "evm_setNextBlockTimestamp", params: [n] });
  if (mine) await mineBlock();
};

export const cloneContract = async (
  deployer: ERC721DAODeployer,
  impl: string
) => {
  const cloneTx = await deployer.cloneContract(impl);
  const receipt = await cloneTx.wait();
  const event = receipt.events?.find((e) => e.event === "NewSingleClone");
  return event?.args?.clone;
};

export const cloneAndinitContract = async (
  deployer: ERC721DAODeployer,
  impl: string,
  initCallData: BytesLike
) => {
  const cloneTx = await deployer.cloneAndInitContract(impl, initCallData);
  const receipt = await cloneTx.wait();
  const event = receipt.events?.find((e) => e.event === "NewSingleClone");
  return event?.args?.clone;
};
