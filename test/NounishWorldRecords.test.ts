// import { ethers } from "hardhat";
// import { expect } from "chai";

// describe("Contract Interaction Tests", function () {
//   let owner: any, executor: any, other: any;
//   let MainFactoryLogic: any, TreasuryLogic: any;
//   let MainFactoryProxy: any, TreasuryProxy: any;

//   beforeEach(async function () {
//     [owner, executor, other] = await ethers.getSigners();
//     console.log("Owner address:", owner.address);
//     console.log("Executor address:", executor.address);
//     console.log("Other address:", other.address);

//     // Deploy MainFactory logic contract
//     const MainFactory = await ethers.getContractFactory("MainFactory");
//     MainFactoryLogic = await MainFactory.deploy();
//     console.log("MainFactory Logic deployed to:", MainFactoryLogic.address);

//     // Deploy Treasury logic contract
//     const Treasury = await ethers.getContractFactory("Treasury");
//     TreasuryLogic = await Treasury.deploy();
//     console.log("Treasury Logic deployed to:", TreasuryLogic.address);

//     // Deploy Proxies and get instances
//     const MainFactoryProxyContract = await ethers.getContractFactory("MainFactoryProxy");
//     MainFactoryProxy = await MainFactoryProxyContract.deploy();
//     console.log("MainFactory Proxy deployed to:", MainFactoryProxy.address);

//     const TreasuryProxyContract = await ethers.getContractFactory("TreasuryProxy");
//     TreasuryProxy = await TreasuryProxyContract.deploy();
//     console.log("Treasury Proxy deployed to:", TreasuryProxy.address);

//     // Get the current owner of the contract
//     const currentOwner = await MainFactoryProxy.owner();
//     console.log("Current owner of MainFactoryProxy:", currentOwner);

//     // Check that the account calling initialize is the owner
//     if (currentOwner !== owner.address) {
//         console.error("Account calling initialize is not the owner of the contract");
//     } else {
//         console.log("Account calling initialize is the owner of the contract");
//     }

//     // Get the function signature and encode the arguments for the initialize function in the MainFactory contract
//     const initializeFunctionSignature = ethers.utils.id("initialize(address,address)");
//     const initializeFunctionArgs = ethers.utils.defaultAbiCoder.encode(
//       ["address", "address"],
//       [TreasuryProxy.address, executor.address]
//     );
//     const initializeFunctionData = initializeFunctionSignature + initializeFunctionArgs.slice(2);

//     // Get the function signature for the initialize function in the Treasury contract
//     const initializeFunctionSignatureTreasury = ethers.utils.id("initialize()");

//     // Initialize the MainFactoryProxy with the MainFactoryLogic address and the data for the initialize function
//     await MainFactoryProxy.initialize(owner.address, MainFactoryLogic.address, initializeFunctionData);

//     // Initialize the TreasuryProxy with the TreasuryLogic address and the data for the initialize function
//     const initializeFunctionDataTreasury = initializeFunctionSignatureTreasury;
//     await TreasuryProxy.initialize(owner.address, TreasuryLogic.address, initializeFunctionDataTreasury);


//     // Get contract instances at the proxy addresses
//     const mainFactory = await ethers.getContractAt("MainFactory", MainFactoryProxy.address);
//     const treasury = await ethers.getContractAt("Treasury", TreasuryProxy.address);

//     // Log the state of the MainFactoryLogic and TreasuryLogic contracts
//     console.log("MainFactory treasury:", await mainFactory.treasury());
//     console.log("MainFactory executor:", await mainFactory.executor());
//     console.log("MainFactory version:", await mainFactory.version());
//     console.log("Treasury version:", await treasury.version());
//   });

//   async function createRecord() {
//     const title = "Test Title";
//     const description = "Test Description";
//     const amount = ethers.utils.parseEther("1");
//     const period = 60;
//     const mainFactory = await ethers.getContractAt("MainFactory", MainFactoryProxy.address);
//     const recordAddress = await mainFactory.connect(executor).createRecord(
//       title,
//       description,
//       amount,
//       period,
//       other.address
//     );
//     return recordAddress;
//   }

//   describe("MainFactory", function () {
//     it("should create a Record", async function () {
//       const recordAddress = await createRecord();
//       const mainFactory = await ethers.getContractAt("MainFactory", MainFactoryProxy.address);
//       expect(await mainFactory.recordContracts(recordAddress)).to.exist;
//     });

//     it("should update a Record", async function () {
//       const recordAddress = await createRecord();
//       const newTitle = "New Test Title";
//       const newDescription = "New Test Description";
//       const newAmount = ethers.utils.parseEther("2");
//       const newPeriod = 120;

//       await MainFactoryProxy.connect(executor).updateRecord(
//         recordAddress,
//         newTitle,
//         newDescription,
//         newAmount,
//         newPeriod,
//         other.address
//       );

//       const record = await ethers.getContractAt("Record", recordAddress);
//       expect(await record.title()).to.equal(newTitle);
//       expect(await record.description()).to.equal(newDescription);
//       expect(await record.amount()).to.equal(newAmount);
//       expect(await record.period()).to.equal(newPeriod);
//       expect(await record.receiver()).to.equal(other.address);
//     });

//     it("should change executor", async function () {
//       const newExecutor = other;
//       await MainFactoryProxy.connect(owner).changeExecutor(newExecutor.address);
//       const mainFactory = await ethers.getContractAt("MainFactory", MainFactoryProxy.address);
//       expect(await mainFactory.executor()).to.equal(newExecutor.address);
//     });

//     it("should pause and unpause", async function () {
//       await MainFactoryProxy.connect(owner).pause();
//       const mainFactory = await ethers.getContractAt("MainFactory", MainFactoryProxy.address);
//       expect(await mainFactory.paused()).to.be.true;

//       await MainFactoryProxy.connect(owner).unpause();
//       expect(await mainFactory.paused()).to.be.false;
//     });

//     it("should pause and unpause a record", async function () {
//       const recordAddress = await createRecord();
//       await MainFactoryProxy.connect(owner).pauseRecord(recordAddress);
//       const record = await ethers.getContractAt("Record", recordAddress);
//       expect(await record.paused()).to.be.true;

//       await MainFactoryProxy.connect(owner).unpauseRecord(recordAddress);
//       expect(await record.paused()).to.be.false;
//     });

//     it("should claim reward for record", async function () {
//       const recordAddress = await createRecord();
//       await MainFactoryProxy.connect(owner).claimRewardForRecord(recordAddress);
//     });
//   });

//   describe("Treasury", function () {
//     it("should allow withdrawal by owner or Record", async function () {
//       await TreasuryProxy.connect(owner).deposit({ value: ethers.utils.parseEther("1") });

//       // Withdraw by owner
//       await TreasuryProxy.connect(owner).withdraw(owner.address, ethers.utils.parseEther("0.5"));
//       expect(await ethers.provider.getBalance(TreasuryProxy.address)).to.equal(ethers.utils.parseEther("0.5"));

//       // Withdraw by Record
//       const recordAddress = await createRecord();
//       const record = await ethers.getContractAt("Record", recordAddress);
//       await TreasuryProxy.addRecord(recordAddress);
//       await record.claim();
//       expect(await ethers.provider.getBalance(TreasuryProxy.address)).to.be.below(ethers.utils.parseEther("0.5"));
//     });

//     it("should allow deposit", async function () {
//       await TreasuryProxy.connect(owner).deposit({ value: ethers.utils.parseEther("1") });
//       expect(await ethers.provider.getBalance(TreasuryProxy.address)).to.equal(ethers.utils.parseEther("1"));
//     });

//     it("should withdraw to a specific address", async function () {
//       await TreasuryProxy.connect(owner).deposit({ value: ethers.utils.parseEther("1") });
//       await TreasuryProxy.connect(owner).withdraw(owner.address, ethers.utils.parseEther("1"));
//       expect(await ethers.provider.getBalance(TreasuryProxy.address)).to.equal(0);
//     });

//     it("should migrate to a new treasury", async function () {
//       const newTreasury = await (await ethers.getContractFactory("Treasury")).deploy();
//       await TreasuryProxy.connect(owner).migrate(newTreasury.address);
//       expect(await ethers.provider.getBalance(newTreasury.address)).to.equal(await newTreasury.getBalance());
//     });
//   });

//   describe("Record", function () {
//     it("should update a Record", async function () {
//       const recordAddress = await createRecord();
//       const record = await ethers.getContractAt("Record", recordAddress);

//       const newTitle = "New Test Title";
//       const newDescription = "New Test Description";
//       const newAmount = ethers.utils.parseEther("2");
//       const newPeriod = 120;
//       const newReceiver = owner.address;

//       await record.updateRecord(newTitle, newDescription, newAmount, newPeriod, newReceiver);

//       expect(await record.title()).to.equal(newTitle);
//       expect(await record.description()).to.equal(newDescription);
//       expect(await record.amount()).to.equal(newAmount);
//       expect(await record.period()).to.equal(newPeriod);
//       expect(await record.receiver()).to.equal(newReceiver);
//     });

//     it("should allow owner to pause and unpause", async function () {
//       const recordAddress = await createRecord();
//       const record = await ethers.getContractAt("Record", recordAddress);

//       await record.pause();
//       expect(await record.paused()).to.be.true;

//       await record.unpause();
//       expect(await record.paused()).to.be.false;
//     });

//     it("should claim and send money to receiver", async function () {
//       const recordAddress = await createRecord();
//       const record = await ethers.getContractAt("Record", recordAddress);
//       const initialBalance = await ethers.provider.getBalance(other.address);

//       await record.claim();
//       const finalBalance = await ethers.provider.getBalance(other.address);

//       expect(finalBalance).to.be.gt(initialBalance);
//     });
//   });
// });


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

    // Initialize the MainFactory contract
    await MainFactoryLogic.initialize(TreasuryLogic.address, executor.address);
    console.log("MainFactory initialized with Treasury:", TreasuryLogic.address, "and Executor:", executor.address);

    // Initialize the Treasury contract
    await TreasuryLogic.initialize();
    console.log("Treasury initialized");

    // Log the state of the MainFactory and Treasury contracts
    console.log("MainFactory treasury:", await MainFactoryLogic.treasury());
    console.log("MainFactory executor:", await MainFactoryLogic.executor());
    console.log("MainFactory version:", await MainFactoryLogic.version());
    console.log("Treasury version:", await TreasuryLogic.version());
  });

  async function createRecord() {
    const title = "Test Title";
    const description = "Test Description";
    const amount = ethers.utils.parseEther("1");
    const period = 60;
    const mainFactory = await ethers.getContractAt("MainFactory", MainFactoryLogic.address);
    const recordAddress = await mainFactory.connect(executor).createRecord(
      title,
      description,
      amount,
      period,
      other.address
    );
    return recordAddress;
  }

  describe("MainFactory", function () {
    it("should create a Record", async function () {
      const recordAddress = await createRecord();
      const mainFactory = await ethers.getContractAt("MainFactory", MainFactoryLogic.address);
      expect(await mainFactory.recordContracts(recordAddress)).to.exist;
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

    it("should change executor", async function () {
      const newExecutor = other;
      await MainFactoryLogic.connect(owner).changeExecutor(newExecutor.address);
      const mainFactory = await ethers.getContractAt("MainFactory", MainFactoryLogic.address);
      expect(await mainFactory.executor()).to.equal(newExecutor.address);
    });

    it("should pause and unpause", async function () {
      await MainFactoryLogic.connect(owner).pause();
      const mainFactory = await ethers.getContractAt("MainFactory", MainFactoryLogic.address);
      expect(await mainFactory.paused()).to.be.true;

      await MainFactoryLogic.connect(owner).unpause();
      expect(await mainFactory.paused()).to.be.false;
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
      await TreasuryLogic.connect(owner).deposit({ value: ethers.utils.parseEther("1") });

      // Withdraw by owner
      await TreasuryLogic.connect(owner).withdraw(owner.address, ethers.utils.parseEther("0.5"));
      expect(await ethers.provider.getBalance(TreasuryLogic.address)).to.equal(ethers.utils.parseEther("0.5"));

      // Withdraw by Record
      const recordAddress = await createRecord();
      const record = await ethers.getContractAt("Record", recordAddress);
      await TreasuryLogic.addRecord(recordAddress);
      await record.claim();
      expect(await ethers.provider.getBalance(TreasuryLogic.address)).to.be.below(ethers.utils.parseEther("0.5"));
    });

    it("should allow deposit", async function () {
      await TreasuryLogic.connect(owner).deposit({ value: ethers.utils.parseEther("1") });
      expect(await ethers.provider.getBalance(TreasuryLogic.address)).to.equal(ethers.utils.parseEther("1"));
    });

    it("should withdraw to a specific address", async function () {
      await TreasuryLogic.connect(owner).deposit({ value: ethers.utils.parseEther("1") });
      await TreasuryLogic.connect(owner).withdraw(owner.address, ethers.utils.parseEther("1"));
      expect(await ethers.provider.getBalance(TreasuryLogic.address)).to.equal(0);
    });

    it("should migrate to a new treasury", async function () {
      const newTreasury = await (await ethers.getContractFactory("Treasury")).deploy();
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

      await record.updateRecord(newTitle, newDescription, newAmount, newPeriod, newReceiver);

      expect(await record.title()).to.equal(newTitle);
      expect(await record.description()).to.equal(newDescription);
      expect(await record.amount()).to.equal(newAmount);
      expect(await record.period()).to.equal(newPeriod);
      expect(await record.receiver()).to.equal(newReceiver);
    });

    it("should allow owner to pause and unpause", async function () {
      const recordAddress = await createRecord();
      const record = await ethers.getContractAt("Record", recordAddress);

      await record.pause();
      expect(await record.paused()).to.be.true;

      await record.unpause();
      expect(await record.paused()).to.be.false;
    });

    it("should claim and send money to receiver", async function () {
      const recordAddress = await createRecord();
      const record = await ethers.getContractAt("Record", recordAddress);
      const initialBalance = await ethers.provider.getBalance(other.address);

      await record.claim();
      const finalBalance = await ethers.provider.getBalance(other.address);

      expect(finalBalance).to.be.gt(initialBalance);
    });
  });
});
