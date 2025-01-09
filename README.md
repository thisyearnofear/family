# Famile.xyz

A decentralized platform for creating and sharing collaborative family gifts, powered by the Lens Network.

## Important: Web3 Setup Requirements

Before starting development, ensure you have:

1. **WalletConnect Project ID** (Required)

   - Sign up at [WalletConnect Cloud](https://cloud.walletconnect.com/)
   - Create a new project
   - Copy the Project ID to `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` in `.env.local`

2. **Alchemy API Key** (Required)

   - Sign up at [Alchemy](https://www.alchemy.com/)
   - Create a new app
   - Copy the API Key to `NEXT_PUBLIC_ALCHEMY_ID` in `.env.local`

3. **Node.js Version**

   - Required: >= 18.17.0
   - Recommended: Use nvm with the provided `.nvmrc`

   ```bash
   nvm install 18.17.0
   nvm use 18.17.0
   ```

4. **Package Manager**
   - Recommended: pnpm
   - Install globally: `npm install -g pnpm`

## Deployed Contracts

### Lens Network Sepolia Testnet (Chain ID: 37111)

- FamileInvites: [`0xFae263fE7ae81169119aC43e6523d51eaBC9b6D2`](https://block-explorer.testnet.lens.dev/address/0xFae263fE7ae81169119aC43e6523d51eaBC9b6D2)
- Network RPC: `https://rpc.testnet.lens.dev`
- Block Explorer: `https://block-explorer.testnet.lens.dev`
- Native Token: GRASS

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
- Web3:
  - Wagmi v2 (latest)
  - ConnectKit v1.8+
  - Viem v2.x
  - @tanstack/react-query v5+
- Storage: IPFS (Pinata)
- Testing: Hardhat, Chai

### Component Architecture

The project follows a carefully structured component hierarchy to handle different gift flows:

#### Gift Flow Separation

1. **Create Gift Flow** (`CreateGiftFlow.tsx`)

   - Wizard-style interface (step-by-step)
   - Local storage draft saving
   - Simple photo upload and preview
   - Can function without wallet connection
   - Uses `PhotoUpload.tsx` for straightforward photo handling

2. **Edit Gift Flow** (`EditGiftFlow.tsx`)
   - Tab-based interface
   - IPFS data loading and staged changes
   - Complex photo states (new/existing/modified)
   - Requires wallet connection and role verification
   - Uses `EditPhotoUpload.tsx` for advanced photo handling

#### Component Organization

```
components/
├── shared/           # Specialized components for specific flows
│   ├── PhotoUpload.tsx        # Simple uploads for CreateGiftFlow
│   ├── EditPhotoUpload.tsx    # Complex uploads for EditGiftFlow
│   └── base/                  # Core reusable components
│       └── BasePhotoUpload.tsx  # Shared upload functionality
└── ui/              # Main flow components
    ├── CreateGiftFlow.tsx
    └── EditGiftFlow.tsx
```

This separation ensures:

- Each flow gets exactly what it needs without unnecessary complexity
- Core functionality is shared through base components
- Specialized components handle flow-specific requirements
- Clear separation of concerns between creation and editing
- Better maintainability and performance optimization

### Wagmi v2 Integration Notes

#### Required Dependencies

```bash
pnpm add wagmi viem@2.x @tanstack/react-query@5
```

#### Key Configuration

```typescript
// utils/wagmi.ts
import { http, createConfig } from 'wagmi'
import { mainnet } from 'wagmi/chains'
import { lensChain } from './constants'

export const config = createConfig({
  chains: [mainnet, lensChain],
  transports: {
    [mainnet.id]: http(),
    [lensChain.id]: http(lensChain.rpcUrls.default.http[0]),
  },
})

// app.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'

const queryClient = new QueryClient()

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {/** App content */}
      </QueryClientProvider>
    </WagmiProvider>
  )
}
```

#### Important Changes from v1

1. **Hooks Updates**:

   - `useNetwork` removed - use `useAccount().chain` instead
   - `useSwitchNetwork` renamed to `useSwitchChain`
   - `useContractWrite` renamed to `useWriteContract`
   - `useContractRead` renamed to `useReadContract`

2. **Chain Configuration**:

   - Chains now come from `viem/chains`
   - Custom chains must match Viem's `Chain` type
   - No more `configureChains` - use `transports` in config

3. **Query Parameters**:

   - TanStack Query params moved to `query` property
   - Example: `{ query: { staleTime, enabled } }`

4. **Connector Updates**:
   - Connectors are now functions instead of classes
   - Example: `walletConnect()` instead of `new WalletConnectConnector()`
   - MetaMaskConnector replaced with `injected({ target: 'metaMask' })`

#### Common Patterns

```typescript
// Network switching
const { chain } = useAccount();
const { switchChain } = useSwitchChain();

// Contract interaction
const { writeContract } = useWriteContract();
const { data } = useReadContract({
  abi,
  address,
  functionName,
  args,
});

// Query configuration
const { data } = useReadContract({
  query: {
    staleTime: 1_000,
    enabled: Boolean(address),
  },
});
```

For more details, see the [Wagmi v2 Migration Guide](https://wagmi.sh/react/guides/migrate-from-v1-to-v2).

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
# Install pnpm globally (recommended)
npm install -g pnpm

# Install project dependencies
pnpm install
```

2. Set up environment variables (create `.env.local`):

```bash
# Web3 Configuration (Required)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id  # From WalletConnect Cloud
NEXT_PUBLIC_ALCHEMY_ID=your_alchemy_id                              # From Alchemy Dashboard
NEXT_PUBLIC_FAMILE_INVITES_ADDRESS=0xFae263fE7ae81169119aC43e6523d51eaBC9b6D2

# Pinata Configuration (for IPFS)
PINATA_API_KEY=your_pinata_api_key
PINATA_API_SECRET=your_pinata_api_secret
PINATA_JWT=your_pinata_jwt
PINATA_GATEWAY=https://gateway.pinata.cloud
```

3. Configure Lens Network:

   - Add Lens Network to MetaMask:
     - Network Name: Lens Network Sepolia Testnet
     - RPC URL: https://rpc.testnet.lens.dev
     - Chain ID: 37111
     - Currency Symbol: GRASS
     - Block Explorer URL: https://block-explorer.testnet.lens.dev

   > Note: A warning such as "This token symbol doesn't match the network name or chain ID entered" is expected at this stage.

4. Get Test Tokens:

   - You can get testnet GRASS tokens from the Lens Network faucets
   - These tokens are required for gas fees and contract interactions

5. Run development server:

```bash
pnpm run dev
```

5. Run tests:

```bash
pnpm run test
```

## Troubleshooting Common Issues

### Node.js Version

If you encounter Node.js version errors:

```bash
# Using nvm
nvm install 18.17.0
nvm use 18.17.0

# Verify installation
node -v  # Should show v18.17.0
```

### Web3 Connection Issues

1. Ensure all required environment variables are set
2. Check WalletConnect Project ID is valid
3. Verify Alchemy API key has access to required networks

### Package Manager Issues

If encountering dependency issues:

```bash
# Clean install
rm -rf node_modules .next pnpm-lock.yaml
pnpm install
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
