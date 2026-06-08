import type { ParsedResponse } from './response-parser';

export type Message = { role: 'user' | 'assistant' | 'system'; content: string };

// Conversations stored per sessionId
export const conversations: Map<string, Message[]> = new Map();

// Parsed assistant output for the last assistant message per sessionId
export const parsedResponses: Map<string, ParsedResponse | null> = new Map();

export function getConversation(sessionId: string): Message[] {
  return conversations.get(sessionId) ?? [];
}

export function setConversation(sessionId: string, messages: Message[]) {
  conversations.set(sessionId, messages);
}

export function setParsedResponse(sessionId: string, parsed: ParsedResponse | null) {
  parsedResponses.set(sessionId, parsed);
}

export function getParsedResponse(sessionId: string): ParsedResponse | null {
  return parsedResponses.get(sessionId) ?? null;
}
