const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("Contract Interaction Tests", function() {
    let owner, executor, other;
    let MainFactoryProxy, TreasuryProxy, MainFactory, Treasury, Record;

    beforeEach(async function() {
        [owner, executor, other] = await ethers.getSigners();

        // Deploy Proxies and get instances
        const MainFactoryProxyContract = await ethers.getContractFactory("MainFactoryProxy");
        MainFactoryProxy = await MainFactoryProxyContract.deploy();
        const TreasuryProxyContract = await ethers.getContractFactory("TreasuryProxy");
        TreasuryProxy = await TreasuryProxyContract.deploy();

        // Deploy MainFactory and Treasury and get instances
        const MainFactoryContract = await ethers.getContractFactory("MainFactory");
        MainFactory = await MainFactoryContract.deploy();
        const TreasuryContract = await ethers.getContractFactory("Treasury");
        Treasury = await TreasuryContract.deploy();

        // Initialize the Proxies with the MainFactory and Treasury addresses
        await MainFactoryProxy.initialize(owner.address, MainFactory.address, "0x");
        await TreasuryProxy.initialize(owner.address, Treasury.address, "0x");

        // Initialize MainFactory and Treasury with appropriate values
        await MainFactory.initialize(TreasuryProxy.address, executor.address, "0x");
        await Treasury.initialize("0x");
    });

    async function createRecord() {
        const title = "Test Title";
        const description = "Test Description";
        const amount = ethers.utils.parseEther("1");
        const period = 60;
        const recordAddress = await MainFactoryProxy.connect(executor).createRecord(title, description, amount, period, other.address);
        return recordAddress;
    }

    describe("MainFactory", function() {
        it("should create a Record", async function() {
            const recordAddress = await createRecord();
            expect(await MainFactoryProxy.recordContracts(recordAddress)).to.exist;
        });

        it("should update a Record", async function() {
            const recordAddress = await createRecord();
            const newTitle = "New Test Title";
            const newDescription = "New Test Description";
            const newAmount = ethers.utils.parseEther("2");
            const newPeriod = 120;

            await MainFactoryProxy.connect(executor).updateRecord(
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

        it("should change executor", async function() {
            const newExecutor = other;
            await MainFactoryProxy.connect(owner).changeExecutor(newExecutor.address);
            // Assert the executor has been changed
            expect(await MainFactoryProxy.executor()).to.equal(newExecutor.address);
        });

        it("should pause and unpause", async function() {
            await MainFactoryProxy.connect(owner).pause();
            expect(await MainFactoryProxy.paused()).to.be.true;

            await MainFactoryProxy.connect(owner).unpause();
            expect(await MainFactoryProxy.paused()).to.be.false;
        });

        it("should pause and unpause a record", async function() {
            const recordAddress = await createRecord(); // Suppose this function creates a new record
            await MainFactoryProxy.connect(owner).pauseRecord(recordAddress);
            expect(await Record.connect(recordAddress).paused()).to.be.true;

            await MainFactoryProxy.connect(owner).unpauseRecord(recordAddress);
            expect(await Record.connect(recordAddress).paused()).to.be.false;
        });

        it("should claim reward for record", async function() {
            const recordAddress = await createRecord(); // Suppose this function creates a new record
            await MainFactoryProxy.connect(owner).claimRewardForRecord(recordAddress);
            // Assert the balance of the receiver is increased.
        });
    });

    describe("Treasury", function() {
        it("should allow withdrawal by owner or Record", async function() {
            await TreasuryProxy.connect(owner).deposit({value: ethers.utils.parseEther("1")});

            // Withdraw by owner
            await TreasuryProxy.connect(owner).withdraw(owner.address, ethers.utils.parseEther("0.5"));
            expect(await ethers.provider.getBalance(TreasuryProxy.address)).to.equal(ethers.utils.parseEther("0.5"));

            // Withdraw by Record
            const recordAddress = await createRecord();
            const record = await ethers.getContractAt("Record", recordAddress);
            await TreasuryProxy.addRecord(recordAddress);
            await record.claim();
            expect(await ethers.provider.getBalance(TreasuryProxy.address)).to.be.below(ethers.utils.parseEther("0.5"));
        });

        it("should allow deposit", async function() {
            await TreasuryProxy.connect(owner).deposit({value: ethers.utils.parseEther("1")});
            // Assert the contract balance is increased.
            expect(await ethers.provider.getBalance(TreasuryProxy.address)).to.equal(ethers.utils.parseEther("1"));
        });

        it("should withdraw to a specific address", async function() {
            await TreasuryProxy.connect(owner).deposit({value: ethers.utils.parseEther("1")});
            await TreasuryProxy.connect(owner).withdraw(owner.address, ethers.utils.parseEther("1"));
            // Assert the contract balance is decreased.
            expect(await ethers.provider.getBalance(TreasuryProxy.address)).to.equal(0);
        });

        it("should migrate to a new treasury", async function() {
            const newTreasury = await ethers.getContractFactory("Treasury").deploy();
            await TreasuryProxy.connect(owner).migrate(newTreasury.address);
            // Assert the balance of the new treasury is increased.
            expect(await ethers.provider.getBalance(newTreasury.address)).to.equal(await newTreasury.getBalance());
        });
    });

    describe("Record", function() {
        it("should update a Record", async function() {
            // Add test for Record updating
        });

        it("should allow owner to pause and unpause", async function() {
            await Record.connect(owner).pause();
            expect(await Record.paused()).to.be.true;

            await Record.connect(owner).unpause();
            expect(await Record.paused()).to.be.false;
        });

        it("should claim and send money to receiver", async function() {
            const initialBalance = await ethers.provider.getBalance(receiver.address);
            await Record.connect(owner).claim();
            const finalBalance = await ethers.provider.getBalance(receiver.address);
            // Assert the balance of the receiver is increased.
            expect(finalBalance).to.be.gt(initialBalance);
        });
    });

});
