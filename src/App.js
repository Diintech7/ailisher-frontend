import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminApp from './AdminApp';
import SuperadminApp from './SuperadminApp';
import OrgApp from './OrgApp';
import UserApp from './UserApp';
import Cookies from 'js-cookie';
import EvaluatorApp from './EvaluatorApp';
import YouTube from './components/YouTube';
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
        <Route path="/superadmin/*" element={<SuperadminApp />} />
        <Route path="/evaluator/*" element={<EvaluatorApp />} />
        <Route path="/organization/*" element={<OrgApp />} />
        <Route path="*" element={<Navigate to="/" replace />} />
        <Route path='/youtube' element={<YouTube/>}/>
      </Routes>
    </Router>
  );
};
export default App;