
export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant'
}

export type ExplanationLevel = 'quick' | 'standard' | 'deep' | 'academic';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  image?: string;
  type?: 'text' | 'image' | 'drawing';
  metadata?: SolveResponse;
}

export interface SolveResponse {
  description: string;
  concepts: string[];
  steps: {
    title: string;
    explanation: string;
    math: string;
  }[];
  finalAnswer: string;
  tutoringTip?: string;
}

export interface ChatHistoryItem {
  id: string;
  title: string;
  timestamp: number;
  lastMessage: string;
}
