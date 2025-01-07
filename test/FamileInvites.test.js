const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("FamileInvites", function () {
  let famileInvites;
  let owner;
  let editor;
  let viewer;
  let nonMember;
  const testGiftId = "gift-test-123";
  const SEVEN_DAYS = 7 * 24 * 60 * 60; // 7 days in seconds

  before(async function () {
    // Get test accounts
    [owner, editor, viewer, nonMember] = await ethers.getSigners();
  });

  beforeEach(async function () {
    // Deploy the contract using the proxy pattern
    const FamileInvites = await ethers.getContractFactory("FamileInvites", owner);
    famileInvites = await upgrades.deployProxy(FamileInvites, [], { initializer: 'initialize' });
    await famileInvites.waitForDeployment();

    // Set up initial state
    await famileInvites.connect(owner).setGiftOwner(testGiftId, owner.address);
  });

  it("should set the deployer as the owner", async function () {
    expect(await famileInvites.owner()).to.equal(owner.address);
  });

  it("should create and accept an invite", async function () {
    // Create invite and get transaction
    const tx = await famileInvites.createInvite(editor.address, testGiftId, "editor", 86400);
    const receipt = await tx.wait();
    
    // Get the InviteCreated event
    const event = receipt.logs.find(
      log => log.fragment && log.fragment.name === 'InviteCreated'
    );
    const inviteId = event.args[0]; // First argument is inviteId

    // Accept invite
    await famileInvites.connect(editor).acceptInvite(inviteId);

    // Verify editor status
    expect(await famileInvites.isEditor(testGiftId, editor.address)).to.equal(true);
  });

  it("should fail to create invite with invalid role", async function () {
    await expect(
      famileInvites.createInvite(editor.address, testGiftId, "invalid_role", 86400)
    ).to.be.revertedWith("Invalid role");
  });

  it("should fail to accept expired invite", async function () {
    // Create invite and get transaction
    const tx = await famileInvites.createInvite(editor.address, testGiftId, "editor", 1);
    const receipt = await tx.wait();
    
    // Get the InviteCreated event
    const event = receipt.logs.find(
      log => log.fragment && log.fragment.name === 'InviteCreated'
    );
    const inviteId = event.args[0]; // First argument is inviteId

    // Wait for invite to expire
    await ethers.provider.send("evm_increaseTime", [2]); // Increase time by 2 seconds
    await ethers.provider.send("evm_mine"); // Mine a new block

    // Try to accept expired invite
    await expect(
      famileInvites.connect(editor).acceptInvite(inviteId)
    ).to.be.revertedWith("Invite expired");
  });
});

// Helper function to get current block timestamp
async function getBlockTimestamp() {
  const block = await ethers.provider.getBlock("latest");
  return block.timestamp;
}
