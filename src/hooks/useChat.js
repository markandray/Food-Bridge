// src/hooks/useChat.js
//
// Manages the chat subscription and send action for a single pickup.
// One listener is opened when pickupId is provided and cleaned up on
// unmount or when pickupId changes — no duplicate listeners possible.

import { useState, useEffect, useCallback } from 'react';
import {
  subscribeToMessages,
  sendMessage as sendMessageService,
} from '../services/chat.service';

const useChat = (pickupId, sender) => {
  // sender = { senderId, senderName, senderRole, recipientId, listingId, foodName }
  // recipientId/listingId/foodName are needed only for the notification
  // sent to the other party — passed in from the page that owns the pickup data.
  // Hook never reads auth directly so it stays reusable for both NGO and restaurant.

  const [messages, setMessages] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [sending, setSending]   = useState(false);

  useEffect(() => {
    if (!pickupId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToMessages(
      pickupId,
      (msgs) => {
        setMessages(msgs);
        setLoading(false);
      },
      (err) => {
        setError(err.message || 'Failed to load messages');
        setLoading(false);
      }
    );

    // Cleanup: unsubscribe when pickupId changes or component unmounts.
    // This guarantees exactly one active listener per open chat window.
    return () => unsubscribe();
  }, [pickupId]);

  const sendMessage = useCallback(async (text) => {
    if (!text?.trim() || !pickupId || !sender) return;
    setSending(true);
    try {
      await sendMessageService(pickupId, {
        senderId:    sender.senderId,
        senderName:  sender.senderName,
        senderRole:  sender.senderRole,
        recipientId: sender.recipientId,
        listingId:   sender.listingId,
        foodName:    sender.foodName,
        text,
      });
    } catch (err) {
      console.error('Failed to send message:', err);
      throw err;
    } finally {
      setSending(false);
    }
  }, [pickupId, sender]);
  return {
  messages,
  loading,
  error,
  sending,
  sendMessage,
};
};

export default useChat;