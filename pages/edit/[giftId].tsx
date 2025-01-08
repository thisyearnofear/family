import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { ConnectKitButton } from 'connectkit';
import { motion } from 'framer-motion';
import EditGiftFlow from '@components/ui/EditGiftFlow';
import { useGiftPermissions } from '@hooks/useGiftPermissions';
import { WalletConnection } from '@components/shared/WalletConnection';
import { GiftFlowLayout } from '@components/shared/GiftFlowLayout';
import ErrorBoundary from '@components/shared/ErrorBoundary';
import type { Step } from '@utils/types/gift';

// Simple loading screen component
function LoadingScreen({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-rose-50 to-teal-50">
      <div className="max-w-md w-full px-4">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg text-center">
          <div className="animate-spin text-2xl mb-4">⏳</div>
          <p className="text-gray-600/90 font-['Lora']">{message}</p>
        </div>
      </div>
    </div>
  );
}

// Simplified dashboard for checking permissions
function SimplifiedDashboard({ giftId, onBack, onWalletConnected }: { giftId: string; onBack: () => void; onWalletConnected: () => void }) {
  const steps: Step[] = ['wallet', 'permissions'];
  const currentStep: Step = 'wallet';
  
  return (
    <ErrorBoundary>
      <GiftFlowLayout
        currentStep={currentStep}
        steps={steps}
        onClose={onBack}
      >
        <div className="max-w-2xl mx-auto px-4">
          {/* Gift ID Display */}
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-['Playfair_Display'] text-gray-800/90 mb-3">
              Edit Gift
            </h1>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-gray-100">
              <p className="text-gray-600 mb-2">Gift ID</p>
              <p className="font-mono text-sm bg-gray-50 p-2 rounded-lg break-all">
                {giftId}
              </p>
            </div>
          </div>

          {/* Wallet Connection */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-100">
            <WalletConnection
              onPrevious={onBack}
              onNext={onWalletConnected}
            />
          </div>

          {/* Help Text */}
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Need help? Check our <a href="#" className="text-blue-500 hover:text-blue-600">guide to editing gifts</a></p>
          </div>
        </div>
      </GiftFlowLayout>
    </ErrorBoundary>
  );
}

export default function EditGiftPage() {
  const router = useRouter();
  const { giftId } = router.query;
  const [shouldCheckPermissions, setShouldCheckPermissions] = useState(false);

  const {
    loading,
    error,
    gift,
    userRole,
    isConnected,
    isLoadingMetadata,
    loadGiftMetadata,
  } = useGiftPermissions(giftId as string, shouldCheckPermissions);

  // Load metadata when we have permissions
  useEffect(() => {
    if (userRole && !gift && !isLoadingMetadata) {
      loadGiftMetadata();
    }
  }, [userRole, gift, isLoadingMetadata, loadGiftMetadata]);

  // If not checking permissions yet, show simplified dashboard
  if (!shouldCheckPermissions) {
    return (
      <SimplifiedDashboard 
        giftId={giftId as string} 
        onBack={() => router.push('/')}
        onWalletConnected={() => setShouldCheckPermissions(true)}
      />
    );
  }

  // Show loading screen while checking permissions
  if (loading) {
    return <LoadingScreen message="Checking permissions..." />;
  }

  // Show loading screen while loading metadata
  if (isLoadingMetadata) {
    return <LoadingScreen message="Loading gift details..." />;
  }

  // If we have a gift and permissions, show the edit flow
  if (gift) {
    return (
      <EditGiftFlow
        gift={gift}
        userRole={userRole || undefined}
        onSave={async (updates) => {
          // TODO: Implement save functionality
          console.log('Saving updates:', updates);
        }}
        onClose={() => router.push('/')}
      />
    );
  }

  // If connected but no permissions, show no access state
  return (
    <EditGiftFlow
      gift={{
        giftId: giftId as string,
        title: '',
        theme: 'japanese',
        photos: [],
        messages: [],
        music: [],
        owner: '',
        editors: [],
        version: 1,
        lastModified: new Date().toISOString(),
      }}
      userRole={userRole || undefined}
      onSave={async () => {}}
      onClose={() => router.push('/')}
    />
  );
}
