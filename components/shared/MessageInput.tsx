import { XMarkIcon } from "@heroicons/react/24/outline";

interface MessageInputProps {
  messages: string[];
  onMessagesChange: (messages: string[]) => void;
  maxMessages?: number;
  defaultMessages?: string[];
}

export function MessageInput({
  messages,
  onMessagesChange,
  maxMessages = 5,
  defaultMessages = [
    "Family is constant — gravity's centre, anchor in the cosmos.",
    "Every memory, an imprint of love, laughter, togetherness: etched in the universe.",
    "Connection transcends distance, time, space: stars bound-unbreakable constellation.",
    "Love is infinite. Happiness innate. Seeing, believing ....",
  ],
}: MessageInputProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-center">Add Messages</h3>
      <p className="text-sm text-gray-600 text-center mb-6">
        Add personal messages that will appear during the gift experience.{" "}
        <br />
        If no messages are added, the default ones will be used.
      </p>

      {messages.map((message, index) => (
        <div key={index} className="flex items-start gap-2">
          <textarea
            value={message}
            onChange={(e) => {
              const newMessages = [...messages];
              newMessages[index] = e.target.value;
              onMessagesChange(newMessages);
            }}
            className="flex-1 p-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            rows={2}
            placeholder={defaultMessages[index % defaultMessages.length]}
          />
          <button
            onClick={() =>
              onMessagesChange(messages.filter((_, i) => i !== index))
            }
            className="p-2 text-red-500 hover:bg-red-50 rounded-full"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      ))}

      {messages.length < maxMessages && (
        <button
          onClick={() => onMessagesChange([...messages, ""])}
          className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600"
        >
          + Add Message
        </button>
      )}
    </div>
  );
}
