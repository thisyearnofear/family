import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAccount, useWriteContract } from 'wagmi';
import { Tab } from '@headlessui/react';
import { WalletConnection } from './WalletConnection';
import { PermissionsManager } from './PermissionsManager';
import { FAMILE_INVITES_ABI, FAMILE_INVITES_ADDRESS } from '@utils/constants';
import type { CollaborativeGift, Editor } from '@utils/types/collaborative';
import type { Role } from '@utils/types/gift';
import { Address } from 'viem';
import { useInvites } from '@hooks/useInvites';

interface PendingInvite {
  id: string;
  role: Role;
  from: string;
  giftId: string;
  expiresAt: number;
}

interface PermissionsDashboardProps {
  gift: CollaborativeGift;
  userRole: 'owner' | 'editor' | undefined;
  onBack: () => void;
  onNext: () => void;
}

function classNames(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ');
}

export function PermissionsDashboard({
  gift,
  userRole,
  onBack,
  onNext,
}: PermissionsDashboardProps) {
  const { address } = useAccount();
  const [selectedTab, setSelectedTab] = useState(0);
  const { writeContract } = useWriteContract();
  const { invites, isLoading } = useInvites(gift.giftId);

  // Extract editor addresses
  const editorAddresses = (gift.editors || []).map(editor => editor.address);

  const tabs = [
    { name: 'Overview', available: true },
    { name: 'Manage Access', available: userRole === 'owner' },
    { name: 'Pending Invites', available: invites.incoming.length > 0 || invites.outgoing.length > 0 },
  ];

  const handleInvite = async (targetAddress: string, role: Role) => {
    if (!address) return;

    await writeContract({
      address: FAMILE_INVITES_ADDRESS as Address,
      abi: FAMILE_INVITES_ABI,
      functionName: 'createInvite',
      args: [
        targetAddress as Address,
        gift.giftId,
        role,
        BigInt(7 * 24 * 60 * 60), // 7 days in seconds
      ] as const,
    });
  };

  const handleRemoveEditor = async (editorAddress: string) => {
    if (!address) return;

    await writeContract({
      address: FAMILE_INVITES_ADDRESS as Address,
      abi: FAMILE_INVITES_ABI,
      functionName: 'removeEditor',
      args: [gift.giftId, editorAddress as Address] as const,
    });
  };

  const handleAcceptInvite = async (inviteId: string) => {
    if (!address) return;

    await writeContract({
      address: FAMILE_INVITES_ADDRESS as Address,
      abi: FAMILE_INVITES_ABI,
      functionName: 'acceptInvite',
      args: [inviteId as `0x${string}`] as const,
    });
  };

  const handleDeclineInvite = async (inviteId: string) => {
    if (!address) return;

    await writeContract({
      address: FAMILE_INVITES_ADDRESS as Address,
      abi: FAMILE_INVITES_ABI,
      functionName: 'cancelInvite',
      args: [inviteId as `0x${string}`] as const,
    });
  };

  const renderInviteCard = (invite: any, type: 'incoming' | 'outgoing') => {
    const isExpired = Date.now() > invite.expiresAt * 1000;
    const isPending = !invite.accepted && !invite.cancelled && !isExpired;

    return (
      <div
        key={invite.id}
        className={classNames(
          'flex items-center justify-between p-4 rounded-lg',
          isPending ? 'bg-white' : 'bg-gray-50',
          'shadow-sm'
        )}
      >
        <div>
          <p className="text-sm text-gray-500">
            {type === 'incoming' ? 'Invited by' : 'Invited'}{' '}
            <span className="font-mono">{type === 'incoming' ? invite.from : invite.to}</span>
          </p>
          <p className="text-sm font-medium capitalize mt-1">
            Role: {invite.role}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {isExpired ? (
              'Expired'
            ) : invite.accepted ? (
              'Accepted'
            ) : invite.cancelled ? (
              'Cancelled'
            ) : (
              `Expires: ${new Date(invite.expiresAt * 1000).toLocaleDateString()}`
            )}
          </p>
        </div>
        {type === 'incoming' && isPending && (
          <div className="flex space-x-2">
            <button
              onClick={() => handleAcceptInvite(invite.id)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Accept
            </button>
            <button
              onClick={() => handleDeclineInvite(invite.id)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Decline
            </button>
          </div>
        )}
        {type === 'outgoing' && isPending && (
          <button
            onClick={() => handleDeclineInvite(invite.id)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Cancel
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-['Playfair_Display'] text-gray-800/90 mb-3 text-center">
          Gift Permissions
        </h1>
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-gray-600 mb-2">Gift ID</p>
          <p className="font-mono text-sm bg-gray-50 p-2 rounded-lg break-all">
            {gift.giftId}
          </p>
        </div>
      </div>

      <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
        <Tab.List className="flex space-x-1 rounded-xl bg-white/80 backdrop-blur-sm p-1 mb-8">
          {tabs.map((tab) => (
            <Tab
              key={tab.name}
              disabled={!tab.available}
              className={({ selected }: { selected: boolean }) =>
                classNames(
                  'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                  'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                  selected
                    ? 'bg-white text-blue-600 shadow'
                    : 'text-gray-600 hover:bg-white/[0.12] hover:text-blue-500',
                  !tab.available && 'opacity-50 cursor-not-allowed'
                )
              }
            >
              {tab.name}
            </Tab>
          ))}
        </Tab.List>
        <Tab.Panels className="mt-2">
          {/* Overview Panel */}
          <Tab.Panel>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-100">
              <h2 className="text-2xl font-['Playfair_Display'] text-gray-800/90 mb-4">
                Your Access Level
              </h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <span className="text-xl">
                    {userRole === 'owner' ? '👑' : userRole === 'editor' ? '✏️' : '👀'}
                  </span>
                  <span className="text-lg text-gray-700 capitalize">
                    {userRole || 'No Access'}
                  </span>
                </div>
                <p className="text-gray-600">
                  {userRole === 'owner'
                    ? 'You have full control over this gift, including managing collaborators.'
                    : userRole === 'editor'
                    ? 'You can edit photos and messages in this gift.'
                    : 'You currently have no access to edit this gift.'}
                </p>
              </div>
            </div>
          </Tab.Panel>

          {/* Manage Access Panel */}
          <Tab.Panel>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-100">
              <PermissionsManager
                giftId={gift.giftId}
                currentEditors={editorAddresses}
                onInvite={handleInvite}
                onRemove={handleRemoveEditor}
              />
            </div>
          </Tab.Panel>

          {/* Pending Invites Panel */}
          <Tab.Panel>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-100">
              {isLoading ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">Loading invites...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Incoming Invites */}
                  {invites.incoming.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Incoming Invites</h3>
                      <div className="space-y-3">
                        {invites.incoming.map((invite) => renderInviteCard(invite, 'incoming'))}
                      </div>
                    </div>
                  )}

                  {/* Outgoing Invites */}
                  {invites.outgoing.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Outgoing Invites</h3>
                      <div className="space-y-3">
                        {invites.outgoing.map((invite) => renderInviteCard(invite, 'outgoing'))}
                      </div>
                    </div>
                  )}

                  {invites.incoming.length === 0 && invites.outgoing.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-gray-600">No pending invites</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>

      <div className="mt-8 flex justify-between">
        <button
          onClick={onBack}
          className="px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          Back
        </button>
        <button
          onClick={onNext}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Continue
        </button>
      </div>
    </div>
  );
} 