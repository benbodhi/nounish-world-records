# Nounish World Records

Important note: I am a noob with solidity, I'm just learning and experimenting. I've only really read contracts before, not written anything for real. I don't know if these work yet because my tests are failing since building this out using a proxy pattern. This is my first attempt at building a contract factory using a proxy pattern for upgradeability. It's actually the first attempt at any real contract from scratch tbh. And again, this might not even work, probably not even close to optimal in terms of gas usage. But it's an idea at the very least. I would love some help.

This is actually the 3rd iteration of these contracts. I started simpler, but later decided to use a proxy pattern.

The purpose is to create a World Record system for Nouns DAO related records and reward the record holders in a way where the record holders and record details can be changed as records are broken.

It's a suite of upgradeable proxies and contracts for a record-keeping system.
The Proxy contract allows for the upgrade of a contract to a new implementation.
The MainFactoryProxy and TreasuryProxy contracts inherit from the Proxy contract.
The MainFactory and Treasury contracts are upgradeable contracts.
The MainFactory contract allows for the creation and updating of records, as well as the pausing and claiming of rewards for records.
The Treasury contract allows for deposits, withdrawals, and migrations of funds.
The Record contract is an upgradeable contract. It allows for the updating of records, pausing and claiming of rewards, and calculating of claimable amounts due.
Anyone can call the claim functions either on the record itself or from the factory, and the funds will be sent to the receiver on the record.
