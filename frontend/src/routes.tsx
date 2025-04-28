import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Login from './pages/Auth/Login';
import Dashboard from './pages/Dashboard';
import Appointments from './pages/Appointments';
import Patients from './pages/Patients';
import Documents from './pages/Documents';
import DocumentDetail from './pages/Documents/DocumentDetail';
import Settings from './pages/Settings';
import MainLayout from './components/layout/MainLayout/MainLayout';
import { Playground } from './playground/playground';


const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Rotas sem layout */}
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      
      {/* Rotas principais com layout */}
      <Route element={<MainLayout sidebarOpen={false} setSidebarOpen={function (): void {
        throw new Error('Function not implemented.');
      } } />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/patients" element={<Patients />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/documents/:category/:id" element={<DocumentDetail />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      {/* Rota do Playground SEM layout do sistema */}
      <Route path="/playground" element={<Playground />} />
    </Routes>
  );
};

export default AppRoutes;