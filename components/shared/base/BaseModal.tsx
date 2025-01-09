import React from "react";
import { Dialog } from "@headlessui/react";

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function BaseModal({
  isOpen,
  onClose,
  title,
  children,
}: BaseModalProps): React.ReactElement {
  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="fixed inset-0 z-50 overflow-y-auto"
    >
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
        <div className="relative bg-white rounded-lg p-6 max-w-md w-full">
          <Dialog.Title className="text-lg font-semibold mb-4">
            {title}
          </Dialog.Title>
          {children}
        </div>
      </div>
    </Dialog>
  );
}
