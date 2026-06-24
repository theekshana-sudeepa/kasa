/**
 * KASA v4.0 — Session Store (Single Source of Truth)
 * 
 * Consolidates all session state into one place:
 * - Conversation messages
 * - Parsed responses
 * - Conversation memory
 * - Ghost cart
 * - Mood tracking
 * - MCP telemetry
 * 
 * Includes TTL-based cleanup to prevent memory leaks.
 */

import type { ParsedResponse } from './response-parser';
import type { ConversationMemory, GhostCartItem, MCPTelemetry, Mood } from '../mcp/types';
import { createEmptyMemory } from './memory-engine';

export type Message = { role: 'user' | 'assistant' | 'system'; content: string };

const MAX_HISTORY = 30;
const SESSION_TTL_MS = 60 * 60 * 1000; // 1 hour

interface SessionEntry {
  messages: Message[];
  parsedResponse: ParsedResponse | null;
  memory: ConversationMemory;
  lastMood: Mood;
  messageCount: number;
  createdAt: number;
  lastActiveAt: number;
}

// ── Main Session Store ──────────────────────────────────
const sessions = new Map<string, SessionEntry>();

// ── MCP Telemetry (global) ──────────────────────────────
const telemetry: MCPTelemetry = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  avgResponseTimeMs: 0,
  lastResponseTimeMs: 0,
  circuitBreakerOpen: false,
};

function getOrCreateSession(sessionId: string): SessionEntry {
  let entry = sessions.get(sessionId);
  if (!entry) {
    entry = {
      messages: [],
      parsedResponse: null,
      memory: createEmptyMemory(),
      lastMood: 'neutral',
      messageCount: 0,
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
    };
    sessions.set(sessionId, entry);
  }
  entry.lastActiveAt = Date.now();
  return entry;
}

// ── Conversation Messages ──────────────────────────────
export function getConversation(sessionId: string): Message[] {
  return getOrCreateSession(sessionId).messages;
}

export function addMessage(sessionId: string, message: Message): void {
  const entry = getOrCreateSession(sessionId);
  entry.messages.push(message);
  entry.messageCount++;
  if (entry.messages.length > MAX_HISTORY) {
    entry.messages = entry.messages.slice(-MAX_HISTORY);
  }
}

export function setConversation(sessionId: string, messages: Message[]) {
  const entry = getOrCreateSession(sessionId);
  entry.messages = messages;
}

// ── Parsed Response ────────────────────────────────────
export function setParsedResponse(sessionId: string, parsed: ParsedResponse | null) {
  const entry = getOrCreateSession(sessionId);
  entry.parsedResponse = parsed;
}

export function getParsedResponse(sessionId: string): ParsedResponse | null {
  return getOrCreateSession(sessionId).parsedResponse;
}

// ── Conversation Memory ────────────────────────────────
export function getMemory(sessionId: string): ConversationMemory {
  return getOrCreateSession(sessionId).memory;
}

export function setMemory(sessionId: string, memory: ConversationMemory): void {
  const entry = getOrCreateSession(sessionId);
  entry.memory = memory;
}

// ── Mood Tracking ──────────────────────────────────────
export function getLastMood(sessionId: string): Mood {
  return getOrCreateSession(sessionId).lastMood;
}

export function setLastMood(sessionId: string, mood: Mood): void {
  const entry = getOrCreateSession(sessionId);
  entry.lastMood = mood;
}

// ── Message Count ──────────────────────────────────────
export function getMessageCount(sessionId: string): number {
  return getOrCreateSession(sessionId).messageCount;
}

// ── MCP Telemetry ──────────────────────────────────────
export function recordMCPRequest(durationMs: number, success: boolean): void {
  telemetry.totalRequests++;
  telemetry.lastResponseTimeMs = durationMs;

  if (success) {
    telemetry.successfulRequests++;
  } else {
    telemetry.failedRequests++;
  }

  // Running average
  telemetry.avgResponseTimeMs = Math.round(
    (telemetry.avgResponseTimeMs * (telemetry.totalRequests - 1) + durationMs) /
      telemetry.totalRequests
  );
}

export function getMCPTelemetry(): MCPTelemetry {
  return { ...telemetry };
}

export function setCircuitBreakerState(open: boolean): void {
  telemetry.circuitBreakerOpen = open;
}

// ── Session Stats (for Dashboard) ──────────────────────
export function getSessionStats(): {
  activeSessions: number;
  totalMessages: number;
  moodDistribution: Record<string, number>;
} {
  let totalMessages = 0;
  const moodDistribution: Record<string, number> = {};

  sessions.forEach((entry) => {
    totalMessages += entry.messageCount;
    const mood = entry.lastMood || 'neutral';
    moodDistribution[mood] = (moodDistribution[mood] || 0) + 1;
  });

  return {
    activeSessions: sessions.size,
    totalMessages,
    moodDistribution,
  };
}

// ── TTL Cleanup ────────────────────────────────────────
export function cleanupStaleSessions(): number {
  const now = Date.now();
  let cleaned = 0;

  sessions.forEach((entry, sessionId) => {
    if (now - entry.lastActiveAt > SESSION_TTL_MS) {
      sessions.delete(sessionId);
      cleaned++;
    }
  });

  return cleaned;
}

// Run cleanup every 15 minutes
if (typeof globalThis !== 'undefined') {
  setInterval(() => {
    const cleaned = cleanupStaleSessions();
    if (cleaned > 0) {
      console.log(`[KASA Session] Cleaned up ${cleaned} stale sessions`);
    }
  }, 15 * 60 * 1000);
}
