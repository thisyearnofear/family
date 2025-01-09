import React from "react";

interface Tab {
  id: string;
  label: string;
  disabled?: boolean;
}

interface TabNavigationProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export function TabNavigation({
  tabs,
  activeTab,
  onChange,
  className = "",
}: TabNavigationProps): React.ReactElement {
  return (
    <div className={`border-b border-gray-200 ${className}`}>
      <nav className="-mb-px flex space-x-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => !tab.disabled && onChange(tab.id)}
            disabled={tab.disabled}
            className={`${
              activeTab === tab.id
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } ${
              tab.disabled ? "opacity-50 cursor-not-allowed" : ""
            } flex items-center px-1 py-4 border-b-2 font-medium text-sm`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
