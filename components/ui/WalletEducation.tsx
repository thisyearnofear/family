import { motion } from "framer-motion";
import { ConnectKitButton } from "connectkit";
import {
  PhotoIcon,
  CheckCircleIcon,
  PencilSquareIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

const features = [
  {
    icon: <PhotoIcon className="w-6 h-6" />,
    title: "Digital Identity",
    description:
      "A wallet is like your digital passport. It's a secure way to identify yourself and interact with web3 applications.",
  },
  {
    icon: <CheckCircleIcon className="w-6 h-6" />,
    title: "Secure Access",
    description:
      "Your wallet ensures only you can access and edit your gifts. It's like having a unique key that no one else can copy.",
  },
  {
    icon: <PencilSquareIcon className="w-6 h-6" />,
    title: "Easy to Start",
    description:
      "Getting a wallet is free and takes just a few minutes. Popular options include MetaMask and Coinbase Wallet.",
  },
  {
    icon: <ArrowPathIcon className="w-6 h-6" />,
    title: "Seamless Experience",
    description:
      "Once connected, you can easily manage your gifts, collaborate with others, and keep your memories secure.",
  },
];

interface WalletEducationProps {
  onBack: () => void;
}

export default function WalletEducation({ onBack }: WalletEducationProps) {
  return (
    <div className="space-y-8">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-['Lora'] text-gray-800/90 mb-3">
            Welcome to Web3 Gifting
          </h2>
          <p className="text-gray-600 max-w-md mx-auto">
            To edit and manage gifts securely, you&apos;ll need a digital
            wallet. Don&apos;t worry, it&apos;s simpler than it sounds!
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 rounded-xl bg-white/50 backdrop-blur-sm"
            >
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-3">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600 text-sm">{feature.description}</p>
            </motion.div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <ConnectKitButton.Custom>
            {({ show }) => (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={show}
                className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Connect Wallet
              </motion.button>
            )}
          </ConnectKitButton.Custom>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onBack}
            className="w-full sm:w-auto px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Back to Home
          </motion.button>
        </div>
      </div>

      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">
          Need Help Getting Started?
        </h3>
        <p className="text-blue-700 mb-4">
          Check out these beginner-friendly wallet options:
        </p>
        <div className="space-y-3">
          <a
            href="https://metamask.io"
            target="_blank"
            rel="noopener noreferrer"
            className="block p-3 bg-white rounded-lg hover:bg-blue-50 transition-colors"
          >
            <span className="font-semibold">MetaMask</span> - Most popular
            wallet, great for beginners
          </a>
          <a
            href="https://www.coinbase.com/wallet"
            target="_blank"
            rel="noopener noreferrer"
            className="block p-3 bg-white rounded-lg hover:bg-blue-50 transition-colors"
          >
            <span className="font-semibold">Coinbase Wallet</span> - Easy to
            use, backed by Coinbase
          </a>
        </div>
      </div>
    </div>
  );
}
