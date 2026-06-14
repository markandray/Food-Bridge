// src/services/chat.service.js
//
// Firestore subcollection: pickups/{pickupId}/messages/{messageId}
// All chat reads and writes are isolated to participants of that pickup.
// No other Firestore collections are touched here.

import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { COLLECTIONS } from '../utils/constants';
import { upsertMessageNotification } from './notifications.service';

// ---------------------------------------------------------------------------
// Helper — returns a ref to the messages subcollection for a given pickup
// ---------------------------------------------------------------------------
const messagesRef = (pickupId) =>
  collection(db, COLLECTIONS.PICKUPS, pickupId, COLLECTIONS.MESSAGES);

// ---------------------------------------------------------------------------
// subscribeToMessages
//
// Opens a real-time listener on pickups/{pickupId}/messages ordered oldest
// → newest. Returns the unsubscribe function — caller must invoke it on
// unmount to avoid memory leaks and duplicate listeners.
//
// callback: (messages: Message[]) => void
// onError:  (error: Error) => void
// ---------------------------------------------------------------------------
export const subscribeToMessages = (pickupId, callback, onError) => {
  const q = query(messagesRef(pickupId), orderBy('createdAt', 'asc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const messages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback(messages);
    },
    (error) => {
      console.error('Chat listener error:', error);
      if (onError) onError(error);
    }
  );
};

// ---------------------------------------------------------------------------
// sendMessage
//
// Writes a normal user message to the subcollection.
// senderId, senderName, senderRole come from the calling hook —
// never trusted from user input.
// ---------------------------------------------------------------------------
export const sendMessage = async (
  pickupId,
  { senderId, senderName, senderRole, text, recipientId, listingId, foodName }
) => {
  if (!text?.trim()) return;

  await addDoc(messagesRef(pickupId), {
    senderId,
    senderName,
    senderRole,
    text: text.trim(),
    createdAt: serverTimestamp(),
    isSystem: false,
  });

  // Notify the other party — never notify yourself.
  // Fire-and-forget: a notification failure must never block message sending.
  if (recipientId && recipientId !== senderId) {
    upsertMessageNotification(
      recipientId,
      pickupId,
      `${senderName} sent you a message about "${foodName}".`,
      listingId
    );
  }
};
// ---------------------------------------------------------------------------
// createSystemMessage
//
// Writes an automated system message (pickup claimed / completed / cancelled).
// Called from pickups.service.js — fire-and-forget, same pattern as
// createNotification. senderId and senderRole are null for system messages.
// ---------------------------------------------------------------------------
export const createSystemMessage = async (pickupId, text) => {
  try {
    await addDoc(messagesRef(pickupId), {
      senderId:   null,
      senderName: 'System',
      senderRole: null,
      text,
      createdAt:  serverTimestamp(),
      isSystem:   true,
    });
  } catch (error) {
    // Fire-and-forget — log but never throw so the parent operation
    // (claim/complete/cancel) is never blocked by a chat write failure.
    console.error('Failed to create system message:', error);
  }
};