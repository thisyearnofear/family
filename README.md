# Famile.xyz

A decentralized platform for creating and sharing collaborative family gifts, powered by the Lens Network.

## Deployed Contracts

### Lens Testnet (Chain ID: 37111)

- FamileInvites: [`0xFae263fE7ae81169119aC43e6523d51eaBC9b6D2`](https://block-explorer.testnet.lens.dev/address/0xFae263fE7ae81169119aC43e6523d51eaBC9b6D2)
- Network RPC: `https://rpc.testnet.lens.dev`
- Block Explorer: `https://block-explorer.testnet.lens.dev`

## Features

- Create collaborative digital gifts with family members
- Invite editors and viewers using Lens Network profiles
- Secure gift ownership and access control
- Beautiful space-themed UI with interactive timeline views
- Custom music playback for each gift
- Real-time collaboration features

## Technical Stack

- Frontend: Next.js, TypeScript, Tailwind CSS, Framer Motion
- Smart Contracts: Solidity (v0.8.24), Hardhat, ZKSync Era
- Web3: Wagmi v2, ConnectKit, Lens Network
- Storage: IPFS (Pinata)
- Testing: Hardhat, Chai

### Known Issues

- **Heroicons TypeScript Definitions**: There are some TypeScript linting errors related to Heroicons exports not being recognized. This is a type definition issue and does not affect the functionality of the UI. Will be addressed in a future update.

## Development Progress

### Phase 1: Core Features ✅

- Basic gift creation and viewing
- Space-themed UI implementation
- Music integration
- Timeline navigation

### Phase 2: Smart Contract Implementation ✅

- FamileInvites contract development
- Access control and permissions
- Contract deployment to Lens testnet
- Contract verification
- Integration with frontend

### Phase 3: Lens Network Integration ✅

- [x] Lens Profile search functionality
- [x] Collaborator management UI
  - Add and remove collaborators
  - Role-based permissions (editor/viewer)
  - Real-time invite status tracking
- [x] Smart contract deployment to Lens testnet
- [x] On-chain invite verification
- [x] Real-time updates for invite status
  - Event-driven invite tracking
  - Automatic UI updates on invite changes
  - Role-based access control (editor/viewer)
  - Time-based invite expiration handling

### Phase 4: Enhanced Features (In Progress)

- [ ] Advanced collaboration features
  - Real-time editing notifications
  - Activity feed for gift changes
  - Collaborative photo annotations
- [ ] Gift templates and themes
  - Japanese garden theme
  - Custom theme builder
- [ ] Advanced media handling
  - Bulk photo upload
  - Video support
  - Photo editing tools
- [ ] Social features
  - Gift sharing on Lens
  - Comment threads
  - Reaction system

## Smart Contracts

### FamileInvites.sol

The main contract managing collaborative gift access and invites:

- Create and manage gift invites with role-based permissions
- Time-bound invitations (up to 7 days validity)
- Role-based access control (editors/viewers)
- Event emission for real-time frontend updates
- Secure ownership management
- Invite cancellation and acceptance tracking

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Set up environment variables:

```bash
# Web3 Configuration
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
NEXT_PUBLIC_ALCHEMY_ID=your_alchemy_id
NEXT_PUBLIC_FAMILE_INVITES_ADDRESS=0xFae263fE7ae81169119aC43e6523d51eaBC9b6D2

# Pinata Configuration (for IPFS)
PINATA_API_KEY=your_pinata_api_key
PINATA_API_SECRET=your_pinata_api_secret
PINATA_JWT=your_pinata_jwt
PINATA_GATEWAY=https://gateway.pinata.cloud
```

3. Configure Lens Network:

- Add Lens Network to MetaMask:
  - Network Name: Lens Testnet
  - RPC URL: https://rpc.testnet.lens.dev
  - Chain ID: 37111
  - Currency Symbol: LENS

4. Run development server:

```bash
npm run dev
```

5. Run tests:

```bash
npm run test
```

## Next Steps

1. Deploy FamileInvites contract to Lens testnet
2. Implement frontend integration with the contract
3. Add real-time updates for invite status
4. Enhance error handling and user feedback
5. Add comprehensive documentation
6. Set up continuous integration

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting pull requests.

## License

MIT License - see LICENSE for details
