import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NavHeader } from './components/layout/NavHeader';
import Dashboard from './pages/Dashboard';
import SubmissionForm from './pages/SubmissionForm';
import SubmissionLog from './pages/SubmissionLog';
import EditHistory from './pages/EditHistory';
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
      <Router>
        <NavHeader />
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/submit" element={<SubmissionForm />} />
          <Route path="/edit/:ticker" element={<SubmissionForm />} />
          <Route path="/submission-log" element={<SubmissionLog />} />
          <Route path="/edit-history" element={<EditHistory />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;

