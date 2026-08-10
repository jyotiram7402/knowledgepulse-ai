import { api } from './client';
import type {
  AdminDocument, AdminStats, AuthResponse, ChatMessage, ChatSession,
  DocumentItem, PageResponse, User
} from '@/types';

export const AuthAPI = {
  register: (name: string, email: string, password: string) =>
    api.post<AuthResponse>('/auth/register', { name, email, password }).then(r => r.data),
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }).then(r => r.data),
};

export const UserAPI = {
  me: () => api.get<User>('/users/me').then(r => r.data),
  update: (payload: { name?: string; currentPassword?: string; newPassword?: string }) =>
    api.put<User>('/users/me', payload).then(r => r.data),
};

export const DocumentsAPI = {
  list: (page = 0, size = 20) =>
    api.get<PageResponse<DocumentItem>>(`/documents?page=${page}&size=${size}`).then(r => r.data),
  search: (q: string) =>
    api.get<DocumentItem[]>(`/documents/search?q=${encodeURIComponent(q)}`).then(r => r.data),
  get: (id: string) => api.get<DocumentItem>(`/documents/${id}`).then(r => r.data),
  upload: (file: File, onProgress?: (pct: number) => void) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post<DocumentItem>('/documents', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress && e.total) onProgress(Math.round((e.loaded * 100) / e.total));
      },
    }).then(r => r.data);
  },
  delete: (id: string) => api.delete<void>(`/documents/${id}`).then(() => undefined),
};

export const ChatAPI = {
  listSessions: () => api.get<ChatSession[]>('/chat/sessions').then(r => r.data),
  createSession: (title?: string) =>
    api.post<ChatSession>('/chat/sessions', { title }).then(r => r.data),
  listMessages: (sessionId: string) =>
    api.get<ChatMessage[]>(`/chat/sessions/${sessionId}/messages`).then(r => r.data),
  send: (sessionId: string, content: string) =>
    api.post<ChatMessage>(`/chat/sessions/${sessionId}/messages`, { content }).then(r => r.data),
  deleteSession: (sessionId: string) =>
    api.delete<void>(`/chat/sessions/${sessionId}`).then(() => undefined),
};

export const AdminAPI = {
  stats: () => api.get<AdminStats>('/admin/stats').then(r => r.data),
  users: () => api.get<User[]>('/admin/users').then(r => r.data),
  documents: () => api.get<AdminDocument[]>('/admin/documents').then(r => r.data),
};
