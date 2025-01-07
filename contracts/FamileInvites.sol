// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

/**
 * @title FamileInvites
 * @dev Manages invites for collaborative gift editing on Famile.xyz
 */
contract FamileInvites is 
    Initializable,
    OwnableUpgradeable,
    PausableUpgradeable,
    ReentrancyGuardUpgradeable 
{
    // Structs
    struct Invite {
        address from;
        address to;
        string giftId;
        string role; // "editor" or "viewer"
        uint256 createdAt;
        uint256 expiresAt;
        bool accepted;
        bool cancelled;
    }

    // State variables
    mapping(bytes32 => Invite) public invites;
    mapping(string => mapping(address => bool)) public giftEditors;
    mapping(string => address) public giftOwners;

    // Events
    event InviteCreated(
        bytes32 indexed inviteId,
        address indexed from,
        address indexed to,
        string giftId,
        string role,
        uint256 expiresAt
    );
    event InviteAccepted(bytes32 indexed inviteId, address indexed by);
    event InviteCancelled(bytes32 indexed inviteId, address indexed by);
    event EditorAdded(string indexed giftId, address indexed editor);
    event EditorRemoved(string indexed giftId, address indexed editor);
    event GiftOwnerSet(string indexed giftId, address indexed owner);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize() public initializer {
        __Ownable_init_unchained();
        __Pausable_init_unchained();
        __ReentrancyGuard_init_unchained();
    }

    /**
     * @dev Sets the owner of a gift
     * @param giftId ID of the gift
     * @param owner Address of the owner
     */
    function setGiftOwner(string calldata giftId, address owner) external onlyOwner {
        require(bytes(giftId).length > 0, "Invalid gift ID");
        require(owner != address(0), "Invalid owner address");
        giftOwners[giftId] = owner;
        emit GiftOwnerSet(giftId, owner);
    }

    /**
     * @dev Creates a new invite
     * @param to Address to invite
     * @param giftId ID of the gift
     * @param role Role to assign ("editor" or "viewer")
     * @param expiresIn Seconds until invite expires
     */
    function createInvite(
        address to,
        string calldata giftId,
        string calldata role,
        uint256 expiresIn
    ) external whenNotPaused nonReentrant {
        require(to != address(0), "Invalid address");
        require(bytes(giftId).length > 0, "Invalid gift ID");
        require(
            keccak256(bytes(role)) == keccak256(bytes("editor")) ||
            keccak256(bytes(role)) == keccak256(bytes("viewer")),
            "Invalid role"
        );
        require(expiresIn > 0 && expiresIn <= 7 days, "Invalid expiry");

        // Check if sender is gift owner or editor
        require(
            giftOwners[giftId] == msg.sender || giftEditors[giftId][msg.sender],
            "Not authorized"
        );

        // Create invite ID
        bytes32 inviteId = keccak256(
            abi.encode(
                msg.sender,
                to,
                giftId,
                role,
                block.timestamp
            )
        );

        // Store invite
        invites[inviteId] = Invite({
            from: msg.sender,
            to: to,
            giftId: giftId,
            role: role,
            createdAt: block.timestamp,
            expiresAt: block.timestamp + expiresIn,
            accepted: false,
            cancelled: false
        });

        emit InviteCreated(inviteId, msg.sender, to, giftId, role, block.timestamp + expiresIn);
    }

    /**
     * @dev Accepts an invite
     * @param inviteId ID of the invite to accept
     */
    function acceptInvite(bytes32 inviteId) external whenNotPaused nonReentrant {
        Invite storage invite = invites[inviteId];
        require(invite.to == msg.sender, "Not invited");
        require(!invite.accepted, "Already accepted");
        require(!invite.cancelled, "Invite cancelled");
        require(block.timestamp <= invite.expiresAt, "Invite expired");

        invite.accepted = true;

        if (keccak256(bytes(invite.role)) == keccak256(bytes("editor"))) {
            giftEditors[invite.giftId][msg.sender] = true;
            emit EditorAdded(invite.giftId, msg.sender);
        }

        emit InviteAccepted(inviteId, msg.sender);
    }

    /**
     * @dev Cancels an invite
     * @param inviteId ID of the invite to cancel
     */
    function cancelInvite(bytes32 inviteId) external whenNotPaused nonReentrant {
        Invite storage invite = invites[inviteId];
        require(invite.from == msg.sender || invite.to == msg.sender, "Not authorized");
        require(!invite.accepted, "Already accepted");
        require(!invite.cancelled, "Already cancelled");

        invite.cancelled = true;
        emit InviteCancelled(inviteId, msg.sender);
    }

    /**
     * @dev Checks if an address is an editor of a gift
     * @param giftId ID of the gift
     * @param editor Address to check
     * @return bool True if the address is an editor
     */
    function isEditor(string calldata giftId, address editor) external view returns (bool) {
        return giftEditors[giftId][editor];
    }

    /**
     * @dev Removes an editor from a gift
     * @param giftId ID of the gift
     * @param editor Address of the editor to remove
     */
    function removeEditor(string calldata giftId, address editor) external whenNotPaused nonReentrant {
        require(giftOwners[giftId] == msg.sender, "Not authorized");
        require(giftEditors[giftId][editor], "Not an editor");

        giftEditors[giftId][editor] = false;
        emit EditorRemoved(giftId, editor);
    }

    // Admin functions
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
} 