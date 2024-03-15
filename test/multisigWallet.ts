import { ethers } from "hardhat"
import { expect } from "chai"

describe("MultiSigWallet Contract", () => {
	let wallet: any
	let owner1: any
	let owner2: any
	let recipient: any

	beforeEach(async () => {
		;[owner1, owner2, recipient] = await ethers.getSigners()

		const MultiSigWalletFactory = await ethers.getContractFactory("MultiSigWallet")
		wallet = await MultiSigWalletFactory.deploy([owner1.address, owner2.address], 2)
	})

	it("should submit a transaction", async () => {
		await wallet.submitTransaction(recipient.address, 100, "0x")
		const count = await wallet.getTransactionCount()
		expect(count).to.equal(1)
	})

	it("should confirm a transaction", async () => {
		await wallet.submitTransaction(recipient.address, 100, "0x")
		await wallet.connect(owner1).confirmTransaction(0)
		const transaction = await wallet.getTransaction(0)
		expect(transaction.numConfirmations).to.equal(1)
	})

	it("should revoke confirmation", async () => {
		await wallet.submitTransaction(recipient.address, 100, "0x")
		await wallet.connect(owner1).confirmTransaction(0)
		await wallet.connect(owner1).revokeConfirmation(0)
		const transaction = await wallet.getTransaction(0)
		expect(transaction.numConfirmations).to.equal(0)
	})

	it("should execute a transaction", async () => {
		await wallet.submitTransaction(recipient.address, 100, "0x")
		await wallet.connect(owner1).confirmTransaction(0)
		await wallet.connect(owner2).confirmTransaction(0)
		await wallet.executeTransaction(0)
		const transaction = await wallet.getTransaction(0)
		expect(transaction.executed).to.be.true
	})

	it("should emit events", async () => {
		await expect(wallet.submitTransaction(recipient.address, 100, "0x"))
			.to.emit(wallet, "SubmitTransaction")
			.withArgs(owner1.address, 0, recipient.address, 100, "0x")
	})
})

describe("TestContract Contract", () => {
	let testContract: any

	beforeEach(async () => {
		const TestContractFactory = await ethers.getContractFactory("TestContract")
		testContract = await TestContractFactory.deploy()
	})

	it("should modify state variable", async () => {
		await testContract.callMe(123)
		const i = await testContract.i()
		expect(i).to.equal(123)
	})

	it("should return encoded data", async () => {
		const encodedData = await testContract.getData()
		const [signature, arg] = ethers.utils.defaultAbiCoder.decode(["string", "uint256"], encodedData)
		expect(signature).to.equal("callMe(uint256)")
		expect(arg).to.equal(123)
	})
})
