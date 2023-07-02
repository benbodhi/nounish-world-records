const hre = require("hardhat");

async function main() {
  const [owner, executor] = await hre.ethers.getSigners();

  // Deploy MainFactory Logic Contract
  const MainFactory = await hre.ethers.getContractFactory("MainFactory");
  const mainFactory = await MainFactory.deploy();

  // Deploy Treasury Logic Contract
  const Treasury = await hre.ethers.getContractFactory("Treasury");
  const treasury = await Treasury.deploy();
  await treasury.initialize();

  // Deploy MainFactoryProxy Contract
  const MainFactoryProxy = await hre.ethers.getContractFactory("MainFactoryProxy");
  const mainFactoryProxy = await MainFactoryProxy.deploy();

  // Initialize Main Factory Proxy Contract
  const mainFactoryInitializationData = hre.ethers.utils.defaultAbiCoder.encode(
    ['address', 'address'],
    [treasury.address, executor.address]
  );
  await mainFactoryProxy.connect(owner).initialize(
    owner.address,
    mainFactory.address,
    mainFactoryInitializationData
  );

  // Deploy TreasuryProxy Contract
  const TreasuryProxy = await hre.ethers.getContractFactory("TreasuryProxy");
  const treasuryProxy = await TreasuryProxy.deploy();

  // Initialize Treasury Proxy Contract
  const treasuryInitializationData = hre.ethers.utils.defaultAbiCoder.encode(
    ['address'],
    [owner.address]
  );
  await treasuryProxy.connect(owner).initialize(
    owner.address,
    treasury.address,
    treasuryInitializationData
  );

  console.log(`MainFactory initialized with address: ${mainFactoryProxy.address}`);
  console.log(`Treasury initialized with address: ${treasuryProxy.address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });