import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

import LoginPage from './pages/LoginPage';
import AnchorPage from './pages/AnchorPage';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/anchor" element={<AnchorPage />} />
      </Routes>
    </Router>
  );
};

export default App;
