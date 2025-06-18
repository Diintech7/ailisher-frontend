import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminApp from './AdminApp';
import UserApp from './UserApp';
import Cookies from 'js-cookie';
import EvaluatorApp from './EvaluatorApp';
const App = () => {
  useEffect(() => {
    const token = Cookies.get('usertoken');
    const admintoken = Cookies.get('admintoken');
    console.log("User/Client token:", token);
    console.log("Admin token:", admintoken);
  });
  return (
    <Router>
      <Routes>
        <Route path="/*" element={<UserApp />} />
        <Route path="/admin/*" element={<AdminApp />} />
        <Route path="/evaluator/*" element={<EvaluatorApp />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};
export default App;