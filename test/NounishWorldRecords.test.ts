import { ethers } from "hardhat";
import { expect } from "chai";

describe("Contract Interaction Tests", function () {
  let owner: any, executor: any, other: any;
  let MainFactoryLogic: any, TreasuryLogic: any;

  beforeEach(async function () {
    [owner, executor, other] = await ethers.getSigners();
    console.log("Owner address:", owner.address);
    console.log("Executor address:", executor.address);
    console.log("Other address:", other.address);

    // Deploy MainFactory contract
    const MainFactory = await ethers.getContractFactory("MainFactory");
    MainFactoryLogic = await MainFactory.deploy();
    console.log("MainFactory deployed to:", MainFactoryLogic.address);

    // Deploy Treasury contract
    const Treasury = await ethers.getContractFactory("Treasury");
    TreasuryLogic = await Treasury.deploy();
    console.log("Treasury deployed to:", TreasuryLogic.address);

    // Initialize the Treasury contract
    await TreasuryLogic.initialize();
    console.log("Treasury initialized");

    // Initialize the MainFactory contract
    await MainFactoryLogic.initialize(TreasuryLogic.address, executor.address);
    console.log("MainFactory initialized with Treasury:", TreasuryLogic.address, "and Executor:", executor.address);
    // console.log("MainFactory initialized");

    // Set MainFactory as the factory in the Treasury contract
    await TreasuryLogic.setFactory(MainFactoryLogic.address);
    console.log("Factory set in Treasury contract");

    // Deposit 20 ETH to the Treasury contract
    await TreasuryLogic.connect(owner).deposit({ value: ethers.utils.parseEther("20") });
    console.log("Deposited 20 ETH to Treasury");

    // await MainFactoryLogic.changeExecutor(executor.address);
    // console.log("MainFactory executor changed to:", executor.address);

    // Log the state of the MainFactory and Treasury contracts
    // console.log("MainFactory treasury:", await MainFactoryLogic.treasury());
    // console.log("MainFactory executor:", await MainFactoryLogic.executor());
    // console.log("MainFactory version:", await MainFactoryLogic.version());
    // console.log("Treasury version:", await TreasuryLogic.version());
  });

  async function createRecord() {
    console.log("Creating record");
    const title = "Test Title";
    const description = "Test Description";
    const amount = ethers.utils.parseEther("1");
    const period = 2592000;
    const mainFactory = await ethers.getContractAt("MainFactory", MainFactoryLogic.address);
    const tx = await mainFactory.connect(owner).createRecord(
      title,
      description,
      amount,
      period,
      other.address
    );
    const receipt = await tx.wait();
    const event = receipt.events.pop();
    const recordAddress = event.args[0];
    console.log("Record created at:", recordAddress);
    return recordAddress;
  }

  describe("MainFactory", function () {
    it("should pause and unpause", async function () {
      await MainFactoryLogic.connect(owner).pause();
      const mainFactory = await ethers.getContractAt("MainFactory", MainFactoryLogic.address);
      expect(await mainFactory.paused()).to.be.true;

      await MainFactoryLogic.connect(owner).unpause();
      expect(await mainFactory.paused()).to.be.false;
    });

    it("should change executor", async function () {
      const newExecutor = other;
      await MainFactoryLogic.connect(owner).changeExecutor(newExecutor.address);
      const mainFactory = await ethers.getContractAt("MainFactory", MainFactoryLogic.address);
      expect(await mainFactory.executor()).to.equal(newExecutor.address);
    });

    it("should create a Record", async function () {
      const recordAddress = await createRecord();
      const mainFactory = await ethers.getContractAt("MainFactory", MainFactoryLogic.address);
      expect(await mainFactory.recordContracts(recordAddress)).to.exist;
      console.log("Record exists");
    });

    it("should update a Record", async function () {
      const recordAddress = await createRecord();
      const newTitle = "New Test Title";
      const newDescription = "New Test Description";
      const newAmount = ethers.utils.parseEther("2");
      const newPeriod = 120;

      await MainFactoryLogic.connect(executor).updateRecord(
        recordAddress,
        newTitle,
        newDescription,
        newAmount,
        newPeriod,
        other.address
      );

      const record = await ethers.getContractAt("Record", recordAddress);
      expect(await record.title()).to.equal(newTitle);
      expect(await record.description()).to.equal(newDescription);
      expect(await record.amount()).to.equal(newAmount);
      expect(await record.period()).to.equal(newPeriod);
      expect(await record.receiver()).to.equal(other.address);
    });

    it("should pause and unpause a record", async function () {
      const recordAddress = await createRecord();
      await MainFactoryLogic.connect(owner).pauseRecord(recordAddress);
      const record = await ethers.getContractAt("Record", recordAddress);
      expect(await record.paused()).to.be.true;

      await MainFactoryLogic.connect(owner).unpauseRecord(recordAddress);
      expect(await record.paused()).to.be.false;
    });

    it("should claim reward for record", async function () {
      const recordAddress = await createRecord();
      await MainFactoryLogic.connect(owner).claimRewardForRecord(recordAddress);
    });
  });

  describe("Treasury", function () {
    it("should allow withdrawal by owner or Record", async function () {
      // await TreasuryLogic.connect(owner).deposit({ value: ethers.utils.parseEther("1") });

      // Withdraw by owner
      await TreasuryLogic.connect(owner).withdraw(owner.address, ethers.utils.parseEther("0.5"));
      expect(await ethers.provider.getBalance(TreasuryLogic.address)).to.equal(ethers.utils.parseEther("19.5"));

      // Withdraw by Record
      const recordAddress = await createRecord();
      const record = await ethers.getContractAt("Record", recordAddress);
      await TreasuryLogic.addRecord(recordAddress);
      await record.claim();
      expect(await ethers.provider.getBalance(TreasuryLogic.address)).to.be.below(ethers.utils.parseEther("19.5"));
    });

    it("should allow deposit", async function () {
      await TreasuryLogic.connect(owner).deposit({ value: ethers.utils.parseEther("1") });
      expect(await ethers.provider.getBalance(TreasuryLogic.address)).to.equal(ethers.utils.parseEther("21"));
    });

    it("should withdraw to a specific address", async function () {
      // await TreasuryLogic.connect(owner).deposit({ value: ethers.utils.parseEther("1") });
      await TreasuryLogic.connect(owner).withdraw(owner.address, ethers.utils.parseEther("20"));
      expect(await ethers.provider.getBalance(TreasuryLogic.address)).to.equal(0);
    });

    it("should migrate to a new treasury", async function () {
      const newTreasury = await (await ethers.getContractFactory("Treasury")).deploy();
      await newTreasury.initialize();
      await TreasuryLogic.connect(owner).migrate(newTreasury.address);
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
      const newReceiver = owner.address;

      // Call updateRecord from MainFactory contract
      await MainFactoryLogic.connect(executor).updateRecord(
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
      await MainFactoryLogic.connect(owner).pauseRecord(recordAddress);
      expect(await record.paused()).to.be.true;

      // Unpause the record through MainFactory contract
      await MainFactoryLogic.connect(owner).unpauseRecord(recordAddress);
      expect(await record.paused()).to.be.false;
    });

    it("should claim and send money to receiver", async function () {
      const recordAddress = await createRecord();
      const record = await ethers.getContractAt("Record", recordAddress);
      const initialBalance = await ethers.provider.getBalance(other.address);
      console.log("Initial balance:", initialBalance.toString());

      const timeIncrease = ethers.BigNumber.from("2592000");
      await ethers.provider.send("evm_increaseTime", [timeIncrease.toNumber()]);
      await ethers.provider.send("evm_mine", []);

      const amount = ethers.utils.parseEther("1");
      const period = ethers.BigNumber.from("2592000");

      const expectedIncrease = timeIncrease.mul(amount).div(period);
      console.log("Expected increase:", expectedIncrease.toString());

      // Claim from the MainFactory contract
      await MainFactoryLogic.connect(owner).claimRewardForRecord(recordAddress);
      const finalBalance = await ethers.provider.getBalance(other.address);
      console.log("Final balance:", finalBalance.toString());

      // Check that the final balance is at least the expected increase
      expect(finalBalance.sub(initialBalance)).to.be.at.least(expectedIncrease);
      console.log("Balance increased by expected amount");
    });
  });
});
