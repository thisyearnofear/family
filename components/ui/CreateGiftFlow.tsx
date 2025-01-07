import { useState, useCallback, useEffect } from "react";
import { useAccount, useWriteContract, useWatchContractEvent } from "wagmi";
import type { Hash } from "viem";
import { FAMILE_INVITES_ABI, FAMILE_INVITES_ADDRESS } from "@utils/constants";
import { createGiftData } from "@utils/helpers";
import type {
  Step,
  Photo,
  GiftTheme,
  CreateGiftData,
  CurrentInvite,
  Role,
  UploadStatus,
} from "@utils/types/gift";
import { GiftFlowLayout } from "@components/shared/GiftFlowLayout";
import { ThemeSelection } from "@components/shared/ThemeSelection";
import { PhotoUpload } from "@components/shared/PhotoUpload";
import { MessageInput } from "@components/shared/MessageInput";
import { MusicSelection } from "@components/shared/MusicSelection";
import { WalletConnection } from "@components/shared/WalletConnection";
import { UploadStatusOverlay } from "@components/shared/UploadStatusOverlay";
import { useGiftCreation } from "@hooks/useGiftCreation";
import { copyToClipboard } from "@utils/helpers";
import { CheckCircleIcon } from "@heroicons/react/24/outline";
import { TitleInput } from "@components/shared/TitleInput";
import { Web3Features } from "@components/shared/Web3Features";
import { PermissionsManager } from "@components/shared/PermissionsManager";
import { CollaboratorInput } from "@components/shared/CollaboratorInput";

const STEPS: Step[] = [
  "theme",
  "photos",
  "messages",
  "music",
  "wallet",
  "collaborators",
  "permissions",
  "preview",
  "confirm",
];

interface CreateGiftFlowProps {
  onComplete: (data: CreateGiftData) => Promise<void>;
  onClose: () => void;
  onGiftCreated: (giftId: string) => void;
}

export default function CreateGiftFlow({
  onComplete,
  onClose,
  onGiftCreated,
}: CreateGiftFlowProps) {
  const [step, setStep] = useState<Step>("theme");
  const [theme, setTheme] = useState<GiftTheme>("space");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [messages, setMessages] = useState<string[]>([]);
  const [selectedSongs, setSelectedSongs] = useState<string[]>([]);
  const [title, setTitle] = useState<string>("A Year in Memories");
  const [currentInvites, setCurrentInvites] = useState<CurrentInvite[]>([]);
  const [customDates, setCustomDates] = useState<{
    [filename: string]: string;
  }>({});
  const { address, isConnected } = useAccount();

  const { uploadStatus, handleCreateGift, handleDownload, setUploadStatus } =
    useGiftCreation({
      onGiftCreated,
    });

  const [txStatus, setTxStatus] = useState<{
    isConfirming: boolean;
    isConfirmed: boolean;
    hash?: string;
  }>({
    isConfirming: false,
    isConfirmed: false,
  });

  // Contract interaction hooks
  const { writeContract } = useWriteContract({
    mutation: {
      onSuccess: (hash: Hash) => {
        setTxStatus((prev) => ({
          ...prev,
          isConfirming: true,
          hash,
        }));
      },
    },
  });

  // Watch for invite creation events
  useWatchContractEvent({
    address: FAMILE_INVITES_ADDRESS,
    abi: FAMILE_INVITES_ABI,
    eventName: "InviteCreated",
    onLogs(logs) {
      const inviteEvent = logs[0];
      if (
        inviteEvent &&
        inviteEvent.args &&
        inviteEvent.args.to &&
        inviteEvent.args.role &&
        inviteEvent.args.expiresAt
      ) {
        const { inviteId, from, to, giftId, role, expiresAt } =
          inviteEvent.args;
        const newInvite: CurrentInvite = {
          address: to.toLowerCase(),
          role: role as Role,
          invitedAt: new Date().toISOString(),
          expiresAt: new Date(Number(expiresAt) * 1000).toISOString(),
          status: "pending",
        };
        handleInviteCreated(newInvite);
        console.log("New invite created", {
          inviteId,
          from,
          to,
          giftId,
          role,
          expiresAt,
        });
      }
      console.log("New invite created", logs);
    },
  });

  // Cleanup previews on unmount
  useEffect(() => {
    return () => {
      photos.forEach((photo) => URL.revokeObjectURL(photo.preview));
    };
  }, [photos]);

  const handleNextStep = useCallback(() => {
    const nextIndex = STEPS.indexOf(step) + 1;
    if (nextIndex < STEPS.length) {
      // If coming from wallet step and not connected, skip collaborator and permissions steps
      if (step === "wallet" && !isConnected) {
        const previewIndex = STEPS.indexOf("preview");
        setStep(STEPS[previewIndex]);
        return;
      }
      setStep(STEPS[nextIndex]);
    }
  }, [step, isConnected]);

  const handlePreviousStep = useCallback(() => {
    const prevIndex = STEPS.indexOf(step) - 1;
    if (prevIndex >= 0) {
      // If going back from preview/confirm and not connected, skip to wallet step
      if ((step === "preview" || step === "confirm") && !isConnected) {
        const walletIndex = STEPS.indexOf("wallet");
        setStep(STEPS[walletIndex]);
        return;
      }
      setStep(STEPS[prevIndex]);
    }
  }, [step, isConnected]);

  const handleComplete = async () => {
    try {
      // If not connected, just do IPFS upload
      if (!isConnected) {
        await handleCreateGift(
          photos,
          theme,
          messages,
          selectedSongs,
          title,
          customDates
        );
        return;
      }

      // For connected users, show contract interaction UI first
      setUploadStatus((prev) => ({
        ...prev,
        status: "verifying",
        message: "Please sign transactions to create your gift",
      }));

      // First handle contract setup
      const giftId = `gift-${Date.now()}-${Math.random().toString(36).slice(2)}`;

      // Set gift ownership
      const setOwnerTx = await writeContract({
        address: FAMILE_INVITES_ADDRESS as `0x${string}`,
        abi: FAMILE_INVITES_ABI,
        functionName: "setGiftOwner",
        args: [giftId, address as `0x${string}`],
      });

      setTxStatus((prev) => ({
        ...prev,
        isConfirming: true,
        hash: typeof setOwnerTx === "string" ? setOwnerTx : undefined,
      }));

      // Create invites for collaborators
      for (const invite of currentInvites) {
        if (invite.status !== "removed") {
          await writeContract({
            address: FAMILE_INVITES_ADDRESS as `0x${string}`,
            abi: FAMILE_INVITES_ABI,
            functionName: "createInvite",
            args: [
              invite.address as `0x${string}`,
              giftId,
              invite.role,
              BigInt(7 * 24 * 60 * 60), // 7 days expiry
            ],
          });
        }
      }

      setTxStatus((prev) => ({
        ...prev,
        isConfirmed: true,
      }));

      // Then handle IPFS upload with the same giftId
      await handleCreateGift(
        photos,
        theme,
        messages,
        selectedSongs,
        title,
        customDates,
        giftId // Pass the giftId we created
      );
    } catch (error) {
      console.error("Error during gift creation:", error);
      setUploadStatus((prev: UploadStatus) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Failed to create gift",
        status: "error" as const,
      }));
    }
  };

  const handleInviteCreated = (invite: CurrentInvite) => {
    setCurrentInvites((prev) => [...prev, invite]);
  };

  const renderStepContent = () => {
    switch (step) {
      case "theme":
        return (
          <ThemeSelection
            onThemeSelect={(t) => {
              setTheme(t);
              handleNextStep();
            }}
          />
        );
      case "photos":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-center">
              Upload Photos
            </h2>
            <PhotoUpload
              photos={photos}
              onPhotosChange={setPhotos}
              customDates={customDates}
              onCustomDatesChange={setCustomDates}
            />
            <div className="flex justify-between space-x-4">
              <button
                onClick={handlePreviousStep}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Back
              </button>
              <button
                onClick={handleNextStep}
                disabled={photos.length === 0}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          </div>
        );
      case "messages":
        return (
          <div className="space-y-8">
            <MessageInput messages={messages} onMessagesChange={setMessages} />
            <TitleInput title={title} onTitleChange={setTitle} />
            <div className="flex justify-between space-x-4">
              <button
                onClick={handlePreviousStep}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Back
              </button>
              <button
                onClick={handleNextStep}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Continue
              </button>
            </div>
          </div>
        );
      case "music":
        return (
          <div className="space-y-6">
            <MusicSelection
              selectedSongs={selectedSongs}
              onSongSelect={setSelectedSongs}
            />
            <div className="flex justify-between space-x-4">
              <button
                onClick={handlePreviousStep}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Back
              </button>
              <button
                onClick={handleNextStep}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Continue
              </button>
            </div>
          </div>
        );
      case "wallet":
        return (
          <WalletConnection
            onPrevious={handlePreviousStep}
            onNext={handleNextStep}
          />
        );
      case "collaborators":
        return (
          <div className="max-w-lg mx-auto">
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <h3 className="text-2xl font-semibold mb-6 text-center">
                Frens/Famile
              </h3>

              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-center text-blue-800">
                  Invite valid for 7 days. <br />
                  Once accepted, they'll have ongoing access to contribute.
                </p>
              </div>

              <CollaboratorInput
                onInviteCreated={(invite) => {
                  setCurrentInvites((prev) => [...prev, invite]);
                }}
              />

              {currentInvites.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-lg font-medium mb-3">Current Invites</h4>
                  <div className="space-y-2">
                    {currentInvites.map((invite, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {invite.displayName || invite.address}
                          </span>
                          <span className="text-sm text-gray-500 capitalize">
                            ({invite.role})
                          </span>
                        </div>
                        <button
                          onClick={() =>
                            setCurrentInvites((prev) =>
                              prev
                                .map((inv, idx) =>
                                  idx === i
                                    ? { ...inv, status: "removed" as const }
                                    : inv
                                )
                                .filter((inv) => inv.status !== "removed")
                            )
                          }
                          className="text-sm text-red-600 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between mt-8">
                <button
                  onClick={handlePreviousStep}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Back
                </button>
                <button
                  onClick={handleNextStep}
                  className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        );
      case "permissions":
        return (
          <div className="max-w-lg mx-auto space-y-8">
            <div className="bg-white rounded-lg p-6 shadow-sm border text-center">
              <h3 className="text-2xl font-semibold mb-6">
                Set Initial Access
              </h3>

              <div className="space-y-6">
                <div className="bg-white rounded-lg p-6">
                  <h4 className="text-lg font-medium mb-4">
                    Your Web3 Capabilities
                  </h4>
                  <ul className="space-y-3 text-left">
                    <li className="flex items-start gap-2">
                      <CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Create invites with expiry times</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Assign editor or viewer roles</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Manage gift permissions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Transfer ownership if needed</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    In the next step, you'll be able to add collaborators who
                    can contribute photos to your gift experience.
                  </p>
                </div>
              </div>

              <div className="flex justify-center gap-3 mt-8">
                <button
                  onClick={handlePreviousStep}
                  className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Back
                </button>
                <button
                  onClick={handleNextStep}
                  className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        );
      case "preview":
        return (
          <div className="max-w-lg mx-auto space-y-8">
            <h2 className="text-2xl font-semibold text-center">
              Your Gift Summary
            </h2>
            <div className="space-y-8">
              {/* Content Preview */}
              <div className="bg-white rounded-lg p-6 shadow-sm border text-center">
                <h3 className="text-lg font-medium mb-6">Your Content</h3>
                <ul className="space-y-4">
                  <li className="flex items-center justify-center gap-2">
                    <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>
                      {photos.length} photos from{" "}
                      {
                        Array.from(
                          new Set(
                            photos.map((p) =>
                              new Date(customDates[p.file.name] || p.dateTaken)
                                .toISOString()
                                .slice(0, 7)
                            )
                          )
                        ).length
                      }{" "}
                      months
                    </span>
                  </li>
                  <li className="flex items-center justify-center gap-2">
                    <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>
                      {messages.length} message{messages.length !== 1 && "s"}
                    </span>
                  </li>
                  <li className="flex items-center justify-center gap-2">
                    <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>
                      {selectedSongs.length} song
                      {selectedSongs.length !== 1 && "s"}
                    </span>
                  </li>
                  <li className="flex items-center justify-center gap-2">
                    <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>
                      {theme === "space" ? "Space" : "Japanese"} theme
                    </span>
                  </li>
                </ul>
              </div>

              {/* Access Info */}
              <div className="bg-white rounded-lg p-6 shadow-sm border text-center">
                <h3 className="text-lg font-medium mb-6">Access & Sharing</h3>
                {!isConnected ? (
                  <div className="bg-blue-50 rounded-lg p-4 max-w-sm mx-auto">
                    <p className="text-sm text-blue-800 mb-3">
                      Creating without a connected wallet
                    </p>
                    <p className="text-sm text-blue-600">
                      You'll get a gift ID to share, but won't be able to edit
                      the gift later.
                      <br />
                      <button
                        onClick={() => setStep("wallet")}
                        className="text-blue-800 underline font-medium mt-2"
                      >
                        Connect wallet for full access
                      </button>
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span>You'll be the gift owner</span>
                    </div>
                    {currentInvites.length > 0 && (
                      <div className="text-sm text-gray-600">
                        <p className="font-medium mb-2">Collaborators:</p>
                        {currentInvites.map((invite, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-center gap-2"
                          >
                            <span>{invite.address}</span>
                            <span>•</span>
                            <span className="capitalize">{invite.role}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="flex justify-center gap-3">
              <button
                onClick={handlePreviousStep}
                className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Back
              </button>
              <button
                onClick={handleNextStep}
                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Continue
              </button>
            </div>
          </div>
        );
      case "confirm":
        return (
          <div className="max-w-lg mx-auto space-y-8">
            <div className="bg-white rounded-lg p-8 shadow-sm border text-center">
              <h2 className="text-2xl font-semibold mb-6">Ready to Create</h2>

              <div className="space-y-6">
                {!isConnected && (
                  <div className="bg-blue-50 rounded-lg p-4 max-w-sm mx-auto mb-6">
                    <p className="text-sm text-blue-600">
                      You're creating without a wallet. You'll get a gift ID to
                      share, but won't be able to make changes later.
                      <br />
                      <button
                        onClick={() => setStep("wallet")}
                        className="text-blue-800 underline font-medium mt-2"
                      >
                        Want to connect a wallet?
                      </button>
                    </p>
                  </div>
                )}

                <div className="max-w-sm mx-auto">
                  {isConnected ? (
                    <>
                      <div className="bg-blue-50 rounded-lg p-4 mb-6 text-left">
                        <h4 className="font-medium mb-2 text-blue-900">
                          Contract Interactions
                        </h4>
                        <p className="text-sm text-blue-800 mb-3">
                          You'll need to sign two transactions on Lens Sepolia
                          testnet:
                        </p>
                        <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
                          <li>Set you as the gift owner (small gas fee)</li>
                          <li>
                            Send {currentInvites.length} invite
                            {currentInvites.length !== 1 ? "s" : ""} to
                            collaborators (small gas fee)
                          </li>
                        </ol>
                        <p className="text-xs text-blue-700 mt-3">
                          Gas fees are paid in $GRASS on Lens Sepolia testnet
                        </p>
                      </div>
                      <p className="text-gray-600 mb-4">
                        After signing, we'll:
                      </p>
                    </>
                  ) : (
                    <p className="text-gray-600 mb-6">
                      Here's what happens next:
                    </p>
                  )}

                  <ul className="space-y-4 text-left">
                    <li className="flex items-start gap-2">
                      <CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Your content is securely stored</span>
                    </li>
                    {isConnected ? (
                      <>
                        <li className="flex items-start gap-2">
                          <CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>You'll be set as the owner</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>7-day invites sent to collaborators</span>
                        </li>
                      </>
                    ) : (
                      <li className="flex items-start gap-2">
                        <CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>You get a gift ID to share</span>
                      </li>
                    )}
                  </ul>
                </div>

                <div className="flex flex-col gap-3 max-w-sm mx-auto mt-8">
                  <button
                    onClick={handleComplete}
                    disabled={uploadStatus.isUploading}
                    className="w-full px-6 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {uploadStatus.isUploading ? "Creating..." : "Create Gift"}
                  </button>
                  <button
                    onClick={handlePreviousStep}
                    disabled={uploadStatus.isUploading}
                    className="w-full px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                  >
                    Back
                  </button>
                  {isConnected && (
                    <p className="text-sm text-gray-500">
                      You can edit or delete your gift anytime
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <GiftFlowLayout currentStep={step} steps={STEPS} onClose={onClose}>
      {renderStepContent()}

      {(uploadStatus.isUploading || uploadStatus.status === "ready") && (
        <UploadStatusOverlay
          status={uploadStatus}
          theme={theme}
          onDownload={() => handleDownload(uploadStatus.giftId!, theme)}
          onClose={onClose}
          onCopyId={() =>
            uploadStatus.giftId && copyToClipboard(uploadStatus.giftId)
          }
        >
          {isConnected &&
            uploadStatus.status === "ready" &&
            !txStatus.isConfirmed && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium mb-2">Ready for your signature</h4>
                <div className="space-y-3 mb-4">
                  <p className="text-sm text-blue-800">
                    Please sign two quick transactions:
                  </p>
                  <ol className="text-sm text-blue-800 list-decimal list-inside space-y-1.5">
                    <li className="flex items-center gap-2">
                      <span>Set you as gift owner</span>
                      {txStatus.isConfirming && (
                        <span className="text-xs text-blue-600">
                          Confirming...
                        </span>
                      )}
                    </li>
                    <li className="flex items-center gap-2">
                      <span>
                        Send {currentInvites.length} invite
                        {currentInvites.length !== 1 ? "s" : ""}
                      </span>
                    </li>
                  </ol>
                  <p className="text-xs text-blue-700">
                    Each transaction needs a small amount of $GRASS for gas
                  </p>
                </div>
                <button
                  onClick={handleComplete}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {txStatus.isConfirming
                    ? "Confirming..."
                    : "Sign Transactions"}
                </button>
              </div>
            )}
        </UploadStatusOverlay>
      )}
    </GiftFlowLayout>
  );
}
