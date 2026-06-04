export interface User {
  id: string;
  name: string;
  email: string;
  roles: string[];
  enabled: boolean;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface DocumentItem {
  id: string;
  filename: string;
  contentType: string;
  fileSize: number;
  url: string | null;
  status: 'PENDING' | 'PROCESSING' | 'READY' | 'FAILED';
  chunkCount: number;
  errorMessage: string | null;
  createdAt: string;
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface Citation {
  marker: number;
  chunkId: string;
  documentId: string;
  chunkIndex: number;
  similarity: number;
  snippet: string;
}

export interface ChatMessage {
  id: string;
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  content: string;
  citations: Citation[];
  createdAt: string;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalDocuments: number;
  totalChunks: number;
  totalSessions: number;
  totalMessages: number;
}

export interface AdminDocument {
  id: string;
  filename: string;
  contentType: string;
  fileSize: number;
  status: string;
  chunkCount: number;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  createdAt: string;
}

export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
}
