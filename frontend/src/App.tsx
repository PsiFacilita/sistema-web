import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { ProtectedRoute, RoleRoute } from './hooks/routes';
import { ROLES } from './hooks/roles';

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
import CustomFields from './pages/CustomFields';
import NonAuthorized from './pages/NonAuthorized';

const App: React.FC = () => {
    return (
        <Router>
            <AuthProvider>
                <Routes>
                    {/* Login */}
                    <Route path="/" element={<Login />} />

                    {/* Acesso permitido a psicólogo e secretária */}
                    <Route
                        path="/dashboard"
                        element={
                            <RoleRoute roles={[ROLES.PSICOLOGO, ROLES.SECRETARIA]}>
                                <Dashboard />
                            </RoleRoute>
                        }
                    />

                    {/* Somente psicólogo */}
                    <Route
                        path="/documents"
                        element={
                            <RoleRoute roles={[ROLES.PSICOLOGO]}>
                                <Documents />
                            </RoleRoute>
                        }
                    />
                    <Route
                        path="/documents/:id"
                        element={
                            <RoleRoute roles={[ROLES.PSICOLOGO]}>
                                <DocumentViewer />
                            </RoleRoute>
                        }
                    />
                    <Route
                        path="/settings"
                        element={
                            <RoleRoute roles={[ROLES.PSICOLOGO]}>
                                <Settings />
                            </RoleRoute>
                        }
                    />
                    <Route
                        path="/custom-fields"
                        element={
                            <RoleRoute roles={[ROLES.PSICOLOGO]}>
                                <CustomFields />
                            </RoleRoute>
                        }
                    />
                    <Route
                        path="/help"
                        element={
                            <RoleRoute roles={[ROLES.PSICOLOGO]}>
                                <Help />
                            </RoleRoute>
                        }
                    />

                    {/* Qualquer usuário autenticado */}
                    <Route
                        path="/patients"
                        element={
                            <ProtectedRoute>
                                <Patients />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/patients/:id"
                        element={
                            <ProtectedRoute>
                                <PatientView />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/records/:id"
                        element={
                            <ProtectedRoute>
                                <PatientRecord />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/appointments"
                        element={
                            <ProtectedRoute>
                                <Appointments />
                            </ProtectedRoute>
                        }
                    />

                    {/* Não autorizado */}
                    <Route path="/not-authorized" element={<NonAuthorized />} />

                    {/* 404 → volta para login */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </AuthProvider>
        </Router>
    );
};

export default App;
