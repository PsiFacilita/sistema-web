import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';

import Dashboard from './pages/Dashboard';
import Documents from './pages/Documents';
import Appointments from './pages/Appointments';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Patients from './pages/Patients';

const App: React.FC = () => {
  return (
    <Router>

        <AuthProvider>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/appointments" element={<Appointments />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/patients" element={<Patients />} />
          </Routes>
        </AuthProvider>
    </Router>
  );
};

export default App;