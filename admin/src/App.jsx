import React, { useContext } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from './components/Navbar/Navbar';
import Sidebar from './components/Sidebar/Sidebar';
import Login from './components/Login/Login';
import Add from './pages/Add/Add';
import List from './pages/List/List';
import Orders from './pages/Orders/Orders';
import Profile from './pages/Profile/Profile';
import { StoreContext } from './context/StoreContext';

const ProtectedRoute = ({ children, token, admin }) => {
  if (!token || !admin) {
    return <Navigate to='/' replace />;
  }
  return children;
};

const App = () => {
  const url = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const { token, admin, setToken, setAdmin } = useContext(StoreContext);

  if (!token || !admin) {
    return (
      <div>
        <ToastContainer />
        <Login url={url} setToken={setToken} setAdmin={setAdmin} />
      </div>
    );
  }

  return (
    <div>
      <ToastContainer />
      <Navbar />
      <div className='app-content'>
        <Sidebar />
        <Routes>
          <Route path='/' element={<Navigate to='/add' replace />} />
          <Route
            path='/add'
            element={
              <ProtectedRoute token={token} admin={admin}>
                <Add url={url} token={token} />
              </ProtectedRoute>
            }
          />
          <Route
            path='/list'
            element={
              <ProtectedRoute token={token} admin={admin}>
                <List url={url} token={token} />
              </ProtectedRoute>
            }
          />
          <Route
            path='/orders'
            element={
              <ProtectedRoute token={token} admin={admin}>
                <Orders url={url} token={token} />
              </ProtectedRoute>
            }
          />
          <Route
            path='/profile'
            element={
              <ProtectedRoute token={token} admin={admin}>
                <Profile url={url} token={token} />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </div>
  );
};

export default App;
