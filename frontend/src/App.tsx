import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import Landing from '@/pages/Landing';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Dashboard from '@/pages/Dashboard';
import Upload from '@/pages/Upload';
import Documents from '@/pages/Documents';
import Chat from '@/pages/Chat';
import ChatHistory from '@/pages/ChatHistory';
import Profile from '@/pages/Profile';
import Admin from '@/pages/Admin';
import NotFound from '@/pages/NotFound';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/app" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/app/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="upload"    element={<Upload />} />
        <Route path="documents" element={<Documents />} />
        <Route path="chat"      element={<Chat />} />
        <Route path="chat/:sessionId" element={<Chat />} />
        <Route path="history"   element={<ChatHistory />} />
        <Route path="profile"   element={<Profile />} />
        <Route path="admin"     element={<ProtectedRoute requireAdmin><Admin /></ProtectedRoute>} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
