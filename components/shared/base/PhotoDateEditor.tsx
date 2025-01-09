import React, { useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

interface PhotoDateEditorProps {
  dateTaken: string;
  onDateChange: (date: string) => void;
  onClose: () => void;
}

export function PhotoDateEditor({
  dateTaken,
  onDateChange,
  onClose,
}: PhotoDateEditorProps): React.ReactElement {
  const [selectedDate, setSelectedDate] = useState(() => {
    const date = new Date(dateTaken);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  });

  const handleSave = () => {
    // Convert YYYY-MM to a full date string (using first of month)
    const [year, month] = selectedDate.split("-");
    const fullDate = new Date(Number(year), Number(month) - 1, 1);
    onDateChange(fullDate.toISOString());
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-sm w-full">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium">Edit Photo Date</h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-lg"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Month and Year
            </label>
            <input
              type="month"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
