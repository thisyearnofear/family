import { format } from "date-fns";
import { useState } from "react";

interface PhotoDateEditorProps {
  dateTaken: string;
  onDateChange: (newDate: string) => void;
  onClose: () => void;
}

export function PhotoDateEditor({
  dateTaken,
  onDateChange,
  onClose,
}: PhotoDateEditorProps) {
  const [tempDate, setTempDate] = useState(dateTaken.split("T")[0]);
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    try {
      const date = new Date(tempDate);
      if (isNaN(date.getTime())) {
        setError("Please enter a valid date");
        return;
      }

      const now = new Date();
      if (date > now) {
        setError("Date cannot be in the future");
        return;
      }

      const minDate = new Date("1900-01-01");
      if (date < minDate) {
        setError("Date cannot be before 1900");
        return;
      }

      onDateChange(date.toISOString());
      onClose();
    } catch (error) {
      setError("Invalid date format");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-sm bg-white rounded-lg p-6 space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900">Edit Date</h3>
          <p className="mt-1 text-sm text-gray-500">
            Choose when this photo should appear
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Photo Date
            </label>
            <input
              type="date"
              value={tempDate}
              onChange={(e) => {
                setTempDate(e.target.value);
                setError(null);
              }}
              max={new Date().toISOString().split("T")[0]}
              min="1900-01-01"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                error ? "border-red-500" : ""
              }`}
            />
            {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
          </div>

          <p className="text-sm text-gray-500">
            Currently set to: {format(new Date(dateTaken), "MMMM d, yyyy")}
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            disabled={!!error}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
