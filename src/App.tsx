import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { NavHeader } from './components/layout/NavHeader';
import Dashboard from './pages/Dashboard';
import SubmissionForm from './pages/SubmissionForm';
import SubmissionLog from './pages/SubmissionLog';
import EditHistory from './pages/EditHistory';
import History from './pages/History';
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <ProtectedRoute>
            <>
              <NavHeader />
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/submit" element={<SubmissionForm />} />
                <Route path="/edit/:ticker" element={<SubmissionForm />} />
                <Route path="/submission-log" element={<SubmissionLog />} />
                <Route path="/edit-history" element={<EditHistory />} />
                <Route path="/history" element={<History />} />
              </Routes>
            </>
          </ProtectedRoute>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

