import React from "react";
import { Send, Square } from "lucide-react";

// Shows Stop while the AI is answering and the text box isn't focused; otherwise a Send/Queue button.
export default function SendOrStopButton({ loading, focused, queued, canSend, onSend, onStop, gradient = "from-indigo-500 to-fuchsia-500" }) {
  if (loading && !focused) {
    return (
      <button onClick={onStop} className="m-1.5 p-2.5 rounded-xl bg-red-600 text-white hover:bg-red-500 transition-colors shrink-0" title="Stop generating">
        <Square className="w-5 h-5" />
      </button>
    );
  }
  return (
    <button
      onMouseDown={(e) => e.preventDefault()}
      onClick={onSend}
      disabled={!canSend}
      className={`m-1.5 p-2.5 rounded-xl bg-gradient-to-br ${gradient} text-white disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity shrink-0`}
      title={queued ? "Add to queue" : "Send"}
    >
      <Send className="w-5 h-5" />
    </button>
  );
}