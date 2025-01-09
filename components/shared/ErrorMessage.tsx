import React from "react";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";

interface ErrorMessageProps {
  title: string;
  message: string;
  className?: string;
}

export function ErrorMessage({
  title,
  message,
  className = "",
}: ErrorMessageProps): React.ReactElement {
  return (
    <div className={`bg-red-50 border-l-4 border-red-500 p-4 ${className}`}>
      <div className="flex items-start">
        <ExclamationCircleIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">{title}</h3>
          <p className="text-sm text-red-700 mt-1">{message}</p>
        </div>
      </div>
    </div>
  );
}
