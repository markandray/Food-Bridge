// src/components/chat/ChatMessage.jsx
//
// Renders a single message bubble.
// Three visual variants:
//   system   — centered, muted, no avatar
//   mine     — right-aligned, emerald bubble
//   theirs   — left-aligned, slate bubble

import { memo } from 'react';
import { ROLES } from '../../utils/constants';

const formatTime = (ts) => {
  if (!ts) return '';
  const date = typeof ts.toDate === 'function' ? ts.toDate() : new Date(ts);
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};

const ChatMessage = memo(({ message, currentUserId }) => {
  // ── System message ───────────────────────────────────────────────────────
  if (message.isSystem) {
    return (
      <div className="flex justify-center my-2">
        <span className="text-xs text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700/60 px-3 py-1 rounded-full">
          {message.text}
        </span>
      </div>
    );
  }

  const isMine = message.senderId === currentUserId;

  // ── Role label shown on the other person's bubble only ───────────────────
  const roleLabel = message.senderRole === ROLES.RESTAURANT ? '🍽 Restaurant' : '🤝 NGO';

  return (
    <div className={`flex flex-col mb-3 ${isMine ? 'items-end' : 'items-start'}`}>

      {/* Sender label — only shown for the other person's messages */}
      {!isMine && (
        <span className="text-xs text-slate-400 dark:text-slate-500 mb-1 ml-1">
          {message.senderName} · {roleLabel}
        </span>
      )}

      <div
        className={`
          max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed
          ${isMine
            ? 'bg-emerald-600 dark:bg-emerald-500 text-white rounded-br-sm'
            : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-bl-sm'
          }
        `}
      >
        {message.text}
      </div>

      {/* Timestamp */}
      <span className="text-xs text-slate-400 dark:text-slate-500 mt-1 mx-1">
        {formatTime(message.createdAt)}
      </span>

    </div>
  );
});

ChatMessage.displayName = 'ChatMessage';
export default ChatMessage;