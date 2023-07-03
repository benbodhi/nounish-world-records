import { ethers, waffle } from "hardhat";
import { Contract, Wallet, utils } from "ethers";
import { Provider } from '@ethersproject/providers';

async function main() {
  const [deployer] = await ethers.getSigners();

  // Deploying Treasury logic contract
  const Treasury = await ethers.getContractFactory("Treasury");
  const treasuryLogic: Contract = await (await Treasury.deploy()).deployed();
  console.log("Treasury Logic deployed to:", treasuryLogic.address);

  // Deploying Treasury Proxy contract
  const TreasuryProxy = await ethers.getContractFactory("TreasuryProxy");
  const treasuryProxy: Contract = await (await TreasuryProxy.deploy()).deployed();
  console.log("Treasury Proxy deployed to:", treasuryProxy.address);

  // Initializing Treasury contract
  await treasuryProxy.initialize(deployer.address, treasuryLogic.address, "0x");
  console.log("Treasury initialized");

  // Deploying MainFactory logic contract
  const MainFactory = await ethers.getContractFactory("MainFactory");
  const mainFactoryLogic: Contract = await (await MainFactory.deploy()).deployed();
  console.log("MainFactory Logic deployed to:", mainFactoryLogic.address);

  // Deploying MainFactory Proxy contract
  const MainFactoryProxy = await ethers.getContractFactory("MainFactoryProxy");
  const mainFactoryProxy: Contract = await (await MainFactoryProxy.deploy()).deployed();
  console.log("MainFactory Proxy deployed to:", mainFactoryProxy.address);

  // Initializing MainFactory contract
  await mainFactoryProxy.initialize(deployer.address, mainFactoryLogic.address, "0x");
  console.log("MainFactory initialized");
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
