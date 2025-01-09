import { BaseModal } from "./BaseModal";

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InfoModal({ isOpen, onClose }: InfoModalProps) {
  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={""}>
      <div className="space-y-4 p-4 max-w-md mx-auto text-center">
        <p className="text-gray-600 italic font-['Lora']">
          &ldquo;Some memories deserve to last...&rdquo;
        </p>

        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">
            A way to...
          </h3>
          <div className="space-y-2">
            <div className="p-3 bg-green-50 rounded-lg">
              <span className="text-2xl">👨‍👩‍👧‍👦</span>
              <p className="text-sm text-green-800">
                Memorialize meaningful moments
              </p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <span className="text-2xl">🌱</span>
              <p className="text-sm text-blue-800">Celebrate the cherished</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">
            Antithesis of...
          </h3>
          <div className="p-3 bg-gray-50 rounded-lg">
            <span className="text-2xl">⚡️</span>
            <p className="text-sm text-gray-600">Ephemeral photo sharing</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-3 rounded-xl">
          <p className="text-sm text-indigo-800">
            Built on{" "}
            <a
              href="https://docs.ipfs.tech/concepts/what-is-ipfs/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-indigo-600"
            >
              IPFS
            </a>
          </p>
        </div>

        <button
          onClick={onClose}
          className="px-6 py-2.5 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors w-full"
        >
          Begin
        </button>
      </div>
    </BaseModal>
  );
}
