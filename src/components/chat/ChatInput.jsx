// src/components/chat/ChatInput.jsx
//
// Controlled text input with Send button.
// Submits on Enter (without Shift) or Send click.
// Disabled while a message is sending to prevent duplicates.

import { useState, useCallback } from 'react';
import { Send } from 'lucide-react';

const ChatInput = ({ onSend, sending, disabled }) => {
  const [text, setText] = useState('');

  const handleSend = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || sending || disabled) return;
    try {
      await onSend(trimmed);
      setText('');
    } catch {
      // Error is logged in useChat — input stays filled so user can retry
    }
  }, [text, sending, disabled, onSend]);

  const handleKeyDown = (e) => {
    // Enter without Shift submits — Shift+Enter allows newlines
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex items-end gap-2 p-4 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        rows={1}
        disabled={disabled}
        className="
          flex-1 resize-none rounded-xl border border-slate-200 dark:border-slate-600
          px-3 py-2.5 text-sm
          bg-white dark:bg-slate-700
          text-slate-800 dark:text-slate-100
          placeholder-slate-400 dark:placeholder-slate-500
          focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500
          disabled:opacity-50 disabled:cursor-not-allowed
          max-h-32 overflow-y-auto
        "
        style={{ lineHeight: '1.5' }}
      />
      <button
        onClick={handleSend}
        disabled={!text.trim() || sending || disabled}
        className="
          flex-shrink-0 w-10 h-10 rounded-xl
          bg-emerald-600 dark:bg-emerald-500
          hover:bg-emerald-700 dark:hover:bg-emerald-600
          disabled:opacity-40 disabled:cursor-not-allowed
          flex items-center justify-center
          transition-colors
        "
        aria-label="Send message"
      >
        <Send className="h-4 w-4 text-white" />
      </button>
    </div>
  );
};

export default ChatInput;