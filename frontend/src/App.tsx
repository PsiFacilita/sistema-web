import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';

import Dashboard from './pages/Dashboard';
import Documents from './pages/Documents';
import Appointments from './pages/Appointments';
import Settings from './pages/Settings';
import PatientRecord from './pages/PatientRecord';
import Login from './pages/Login';
import Patients from './pages/Patients';
import Help from './pages/Help';

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
            <Route path="/records" element={<PatientRecord />} />
            <Route path="/patients" element={<Patients />} />
            <Route path="/help" element={<Help />} />
          </Routes>
        </AuthProvider>
    </Router>
  );
};

export default App;