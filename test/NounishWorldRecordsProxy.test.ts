import { ethers } from "hardhat";
import { expect } from "chai";
import { Signer, Contract } from "ethers";

describe("Proxy Contract Interaction Tests", function () {
  // let owner: any, executor: any, other: any;
  // let MainFactoryLogic: any, TreasuryLogic: any;
  // let MainFactoryProxyInstance: any, TreasuryProxyInstance: any;
  let owner: Signer, executor: Signer, other: Signer;
  let MainFactoryLogic: Contract, TreasuryLogic: Contract;
  let MainFactoryProxyInstance: Contract, TreasuryProxyInstance: Contract;


  beforeEach(async function () {
    console.log("Setting up beforeEach...");

    [owner, executor, other] = await ethers.getSigners();
    console.log("Owner address:", owner.getAddress());
    console.log("Executor address:", executor.getAddress());
    console.log("Other address:", other.getAddress());

    // Deploy Treasury logic contract
    const Treasury = await ethers.getContractFactory("Treasury");
    // console.log("Deploying Treasury logic contract...");
    const treasuryLogic = await Treasury.deploy();
    await treasuryLogic.deployed();
    console.log("Treasury logic contract deployed at: ", treasuryLogic.address);

    // Deploy MainFactory logic contract
    const MainFactory = await ethers.getContractFactory("MainFactory");
    // console.log("Deploying MainFactory logic contract...");
    const mainFactoryLogic = await MainFactory.deploy();
    await mainFactoryLogic.deployed();
    console.log("MainFactory logic contract deployed at: ", mainFactoryLogic.address);

    // Deploy Treasury proxy contract
    const TreasuryProxy = await ethers.getContractFactory("TreasuryProxy");
    // console.log("Deploying Treasury proxy contract...");
    const treasuryProxy = await TreasuryProxy.deploy(treasuryLogic.address);
    await treasuryProxy.deployed();
    console.log("Treasury proxy contract deployed at: ", treasuryProxy.address);

    // Deploy MainFactory proxy contract
    const MainFactoryProxy = await ethers.getContractFactory("MainFactoryProxy");
    // console.log("Deploying MainFactory proxy contract...");
    const mainFactoryProxy = await MainFactoryProxy.deploy(mainFactoryLogic.address);
    await mainFactoryProxy.deployed();
    console.log("MainFactory proxy contract deployed at: ", mainFactoryProxy.address);

    // Initialize the Treasury contract
    await treasuryLogic.initialize();
    console.log("Treasury initialized");

    // Initialize the MainFactory contract
    await mainFactoryLogic.initialize(treasuryProxy.address, owner.getAddress());
    console.log("MainFactory initialized with Treasury:", treasuryProxy.address, "and Executor:", owner.getAddress());

    // Transfer ownership of Treasury logic contract
    console.log("Transferring ownership of Treasury logic contract...");
    const initialTreasuryOwner = await treasuryLogic.getOwner();
    console.log("Initial Treasury owner: ", initialTreasuryOwner);
    await treasuryLogic.transferOwnership(treasuryProxy.address);
    const finalTreasuryOwner = await treasuryLogic.getOwner();
    console.log("Final Treasury owner: ", finalTreasuryOwner);

    // Transfer ownership of MainFactory logic contract
    console.log("Transferring ownership of MainFactory logic contract...");
    const initialMainFactoryOwner = await mainFactoryLogic.getOwner();
    console.log("Initial MainFactory owner: ", initialMainFactoryOwner);
    await mainFactoryLogic.transferOwnership(mainFactoryProxy.address);
    const finalMainFactoryOwner = await mainFactoryLogic.getOwner();
    console.log("Final MainFactory owner: ", finalMainFactoryOwner);

    // Create instances of the logic contracts at the proxy contracts' addresses
    console.log("Creating contract instances at proxy addresses...");
    TreasuryProxyInstance = await ethers.getContractAt("Treasury", treasuryProxy.address);
    // console.log("Initializing Treasury contract through the proxy...");
    // await TreasuryProxyInstance.connect(owner).initialize();
    // console.log("Treasury contract initialized.");

    // Do the same for the MainFactory
    MainFactoryProxyInstance = await ethers.getContractAt("MainFactory", mainFactoryProxy.address);
    // console.log("Initializing MainFactory contract through the proxy...");
    // await MainFactoryProxyInstance.connect(owner).initialize();
    // console.log("MainFactory contract initialized.");

    console.log("TreasuryProxyInstance address:", TreasuryProxyInstance.address);
    console.log("MainFactoryProxyInstance address:", MainFactoryProxyInstance.address);

    console.log("treasuryProxy.getOwner():", await treasuryProxy.getOwner());
    console.log("TreasuryLogic Owner:", await treasuryLogic.owner());
    console.log("mainFactoryProxy.getOwner():", await mainFactoryProxy.getOwner());
    console.log("MainFactoryLogic Owner:", await mainFactoryLogic.owner());

    // Fetch the implementation address of the TreasuryProxy contract
    const treasuryProxyImplementationAddress = await ethers.provider.getStorageAt(TreasuryProxyInstance.address, ethers.constants.HashZero);
    console.log("TreasuryProxy implementation address:", treasuryProxyImplementationAddress);

    // Fetch the implementation address of the MainFactoryProxy contract
    const mainFactoryProxyImplementationAddress = await ethers.provider.getStorageAt(MainFactoryProxyInstance.address, ethers.constants.HashZero);
    console.log("MainFactoryProxy implementation address:", mainFactoryProxyImplementationAddress);

    // // Set the factory address on the treasury
    // console.log("Setting factory address on Treasury...");
    // // await TreasuryProxyInstance.connect(owner).setFactory(mainFactoryProxy.address);
    // await TreasuryProxyInstance.connect(treasuryProxy.address).setFactory(mainFactoryProxy.address);
    // console.log("Factory address set on Treasury.");

    // Connect to the TreasuryProxy contract with the owner
    const connectedTreasuryProxyInstance = TreasuryProxyInstance.connect(owner);
    // Get the address of the MainFactoryProxy contract
    const mainFactoryProxyAddress = mainFactoryProxy.address;
    // Set the factory address on the treasury
    await connectedTreasuryProxyInstance.setFactory(mainFactoryProxyAddress);
    console.log("Factory address set on Treasury.");

    // Deposit 20 ETH into the treasury
    console.log("Depositing 20 ETH into Treasury...");
    await owner.sendTransaction({to: treasuryProxy.address, value: ethers.utils.parseEther('20')});
    console.log("20 ETH deposited into Treasury.");

    console.log("beforeEach setup complete.");
  });

  async function createRecord() {
    console.log("Creating record");
    const title = "Test Title";
    const description = "Test Description";
    const amount = ethers.utils.parseEther("1");
    const period = 2592000;
    const mainFactory = await ethers.getContractAt("MainFactory", MainFactoryProxyInstance.address);
    const tx = await mainFactory.connect(owner).createRecord(
      title,
      description,
      amount,
      period,
      other.getAddress()
    );
    const receipt = await tx.wait();
    const event = receipt.events.pop();
    const recordAddress = event.args[0];
    console.log("Record created at:", recordAddress);
    return recordAddress;
  }

  describe("MainFactory", function () {
    it("should pause and unpause", async function () {
      await MainFactoryProxyInstance.connect(owner).pause();
      const mainFactory = await ethers.getContractAt("MainFactory", MainFactoryProxyInstance.address);
      expect(await mainFactory.paused()).to.be.true;

      await MainFactoryProxyInstance.connect(owner).unpause();
      expect(await mainFactory.paused()).to.be.false;
    });

    it("should change executor", async function () {
      const newExecutor = other;
      await MainFactoryProxyInstance.connect(owner).changeExecutor(newExecutor.getAddress());
      const mainFactory = await ethers.getContractAt("MainFactory", MainFactoryProxyInstance.address);
      expect(await mainFactory.executor()).to.equal(newExecutor.getAddress());
    });

    it("should create a Record", async function () {
      const recordAddress = await createRecord();
      const mainFactory = await ethers.getContractAt("MainFactory", MainFactoryProxyInstance.address);
      expect(await mainFactory.recordContracts(recordAddress)).to.exist;
      console.log("Record exists");
    });

    it("should update a Record", async function () {
      const recordAddress = await createRecord();
      const newTitle = "New Test Title";
      const newDescription = "New Test Description";
      const newAmount = ethers.utils.parseEther("2");
      const newPeriod = 120;

      await MainFactoryProxyInstance.connect(executor).updateRecord(
        recordAddress,
        newTitle,
        newDescription,
        newAmount,
        newPeriod,
        other.getAddress()
      );

      const record = await ethers.getContractAt("Record", recordAddress);
      expect(await record.title()).to.equal(newTitle);
      expect(await record.description()).to.equal(newDescription);
      expect(await record.amount()).to.equal(newAmount);
      expect(await record.period()).to.equal(newPeriod);
      expect(await record.receiver()).to.equal(other.getAddress());
    });

    it("should pause and unpause a record", async function () {
      const recordAddress = await createRecord();
      await MainFactoryProxyInstance.connect(owner).pauseRecord(recordAddress);
      const record = await ethers.getContractAt("Record", recordAddress);
      expect(await record.paused()).to.be.true;

      await MainFactoryProxyInstance.connect(owner).unpauseRecord(recordAddress);
      expect(await record.paused()).to.be.false;
    });

    it("should claim reward for record", async function () {
      const recordAddress = await createRecord();
      await MainFactoryProxyInstance.connect(owner).claimRewardForRecord(recordAddress);
    });
  });

  describe("Treasury", function () {
    it("should allow withdrawal by owner or Record", async function () {
      // await TreasuryProxyInstance.connect(owner).deposit({ value: ethers.utils.parseEther("1") });

      // Withdraw by owner
      await TreasuryProxyInstance.connect(owner).withdraw(owner.getAddress(), ethers.utils.parseEther("0.5"));
      expect(await ethers.provider.getBalance(TreasuryProxyInstance.address)).to.equal(ethers.utils.parseEther("19.5"));

      // Withdraw by Record
      const recordAddress = await createRecord();
      const record = await ethers.getContractAt("Record", recordAddress);
      await TreasuryProxyInstance.addRecord(recordAddress);
      await record.claim();
      expect(await ethers.provider.getBalance(TreasuryProxyInstance.address)).to.be.below(ethers.utils.parseEther("19.5"));
    });

    it("should allow deposit", async function () {
      await TreasuryProxyInstance.connect(owner).deposit({ value: ethers.utils.parseEther("1") });
      expect(await ethers.provider.getBalance(TreasuryProxyInstance.address)).to.equal(ethers.utils.parseEther("21"));
    });

    it("should withdraw to a specific address", async function () {
      // await TreasuryProxyInstance.connect(owner).deposit({ value: ethers.utils.parseEther("1") });
      await TreasuryProxyInstance.connect(owner).withdraw(owner.getAddress(), ethers.utils.parseEther("20"));
      expect(await ethers.provider.getBalance(TreasuryProxyInstance.address)).to.equal(0);
    });

    it("should migrate to a new treasury", async function () {
      const newTreasury = await (await ethers.getContractFactory("Treasury")).deploy();
      await newTreasury.initialize();
      await TreasuryProxyInstance.connect(owner).migrate(newTreasury.address);
      expect(await ethers.provider.getBalance(newTreasury.address)).to.equal(await newTreasury.getBalance());
    });
  });

  describe("Record", function () {
    it("should update a Record", async function () {
      const recordAddress = await createRecord();
      const record = await ethers.getContractAt("Record", recordAddress);

      const newTitle = "New Test Title";
      const newDescription = "New Test Description";
      const newAmount = ethers.utils.parseEther("2");
      const newPeriod = 120;
      const newReceiver = owner.getAddress();

      // Call updateRecord from MainFactory contract
      await MainFactoryProxyInstance.connect(executor).updateRecord(
        recordAddress,
        newTitle,
        newDescription,
        newAmount,
        newPeriod,
        newReceiver
      );

      expect(await record.title()).to.equal(newTitle);
      expect(await record.description()).to.equal(newDescription);
      expect(await record.amount()).to.equal(newAmount);
      expect(await record.period()).to.equal(newPeriod);
      expect(await record.receiver()).to.equal(newReceiver);
    });

    it("should allow owner to pause and unpause", async function () {
      const recordAddress = await createRecord();
      const record = await ethers.getContractAt("Record", recordAddress);

      // Pause the record through MainFactory contract
      await MainFactoryProxyInstance.connect(owner).pauseRecord(recordAddress);
      expect(await record.paused()).to.be.true;

      // Unpause the record through MainFactory contract
      await MainFactoryProxyInstance.connect(owner).unpauseRecord(recordAddress);
      expect(await record.paused()).to.be.false;
    });

    it("should claim and send money to receiver", async function () {
      const recordAddress = await createRecord();
      const record = await ethers.getContractAt("Record", recordAddress);
      const initialBalance = await ethers.provider.getBalance(other.getAddress());
      console.log("Initial balance:", initialBalance.toString());

      const timeIncrease = ethers.BigNumber.from("2592000");
      await ethers.provider.send("evm_increaseTime", [timeIncrease.toNumber()]);
      await ethers.provider.send("evm_mine", []);

      const amount = ethers.utils.parseEther("1");
      const period = ethers.BigNumber.from("2592000");

      const expectedIncrease = timeIncrease.mul(amount).div(period);
      console.log("Expected increase:", expectedIncrease.toString());

      // Claim from the MainFactory contract
      await MainFactoryProxyInstance.connect(owner).claimRewardForRecord(recordAddress);
      const finalBalance = await ethers.provider.getBalance(other.getAddress());
      console.log("Final balance:", finalBalance.toString());

      // Check that the final balance is at least the expected increase
      expect(finalBalance.sub(initialBalance)).to.be.at.least(expectedIncrease);
      console.log("Balance increased by expected amount");
    });
  });
});
