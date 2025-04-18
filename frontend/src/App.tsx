import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

import LoginPage from './pages/LoginPage';
import ButtonTeste from './components/Button/ButtonTeste'; 

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/teste-botao" element={<ButtonTeste />} /> 
      </Routes>
    </Router>
  );
};

export default App;
