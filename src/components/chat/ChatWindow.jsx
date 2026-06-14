// src/components/chat/ChatWindow.jsx
//
// Full chat UI for a single pickup.
// Composes useChat + ChatMessage + ChatInput.
// Auto-scrolls to bottom on every new message.
// Designed to render inside Modal size="lg".

import { useEffect, useRef } from 'react';
import { MessageCircle } from 'lucide-react';
import useChat from '../../hooks/useChat';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import Spinner from '../common/Spinner';

const ChatWindow = ({ pickupId, sender, pickupLabel }) => {
  // sender = { senderId, senderName, senderRole }
  const { messages, loading, error, sending, sendMessage } = useChat(pickupId, sender);
  const bottomRef = useRef(null);

  // Auto-scroll to bottom whenever messages array changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="md" />
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col" style={{ height: '480px' }}>

      {/* Pickup context label */}
      {pickupLabel && (
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700 flex-shrink-0">
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
            <span className="font-medium text-slate-700 dark:text-slate-300">Pickup:</span>{' '}
            {pickupLabel}
          </p>
        </div>
      )}

      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {messages.length === 0 ? (
          // ── Empty state ────────────────────────────────────────────────
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
              <MessageCircle className="h-6 w-6 text-emerald-500 dark:text-emerald-400" />
            </div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
              Start coordinating this pickup.
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Messages are only visible to you and the other party.
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              currentUserId={sender.senderId}
            />
          ))
        )}
        {/* Invisible anchor div — scrollIntoView targets this */}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <ChatInput onSend={sendMessage} sending={sending} />
    </div>
  );
};

export default ChatWindow;