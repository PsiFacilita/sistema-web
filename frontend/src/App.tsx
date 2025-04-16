import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

import LoginPage from './pages/LoginPage';
import TestDropdownPage from './pages/TestDropdownPage';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/dropdown" element={<TestDropdownPage />} />
      </Routes>
    </Router>
  );
};

export default App;
