import React from "react";
import { MessageInput } from "./MessageInput";

interface MessageEditorProps {
  messages: string[];
  onChange: (messages: string[]) => void;
}

export function MessageEditor({
  messages,
  onChange,
}: MessageEditorProps): React.ReactElement {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-center">Edit Messages</h2>
      <MessageInput messages={messages} onMessagesChange={onChange} />
    </div>
  );
}
