import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';

import Dashboard from './pages/Dashboard';
import Documents from './pages/Documents';
import DocumentViewer from './pages/DocumentViewer';
import Appointments from './pages/Appointments';
import Settings from './pages/Settings';
import PatientRecord from './pages/PatientRecord';
import PatientView from './pages/PatientView';
import Login from './pages/Login';
import Patients from './pages/Patients';
import Help from './pages/Help';
import PasswordReset from './pages/PasswordReset';

const App: React.FC = () => {
  return (
    <Router>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Login />} />

            <Route path="/dashboard" element={<Dashboard />} />

            <Route path="/patients" element={<Patients />} />
            <Route path="/patients/:id" element={<PatientView />} />
            <Route path="/records/:id" element={<PatientRecord />} />


            <Route path="/appointments" element={<Appointments />} />

            <Route path="/documents" element={<Documents />} />
            <Route path="/documents/:id" element={<DocumentViewer />} />

            <Route path="/settings" element={<Settings />} />

            <Route path="/help" element={<Help />} />

            <Route path="/password-reset" element={<PasswordReset />} />
          </Routes>
        </AuthProvider>
    </Router>
  );
};

export default App;