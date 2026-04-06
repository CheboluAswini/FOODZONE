import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { StoreContext } from '../../context/StoreContext';
import './Login.css';

const Login = ({ url, setToken: setAppToken, setAdmin: setAppAdmin }) => {
  const navigate = useNavigate();
  const { admin, setAdmin, token, setToken } = useContext(StoreContext);
  const [data, setData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const onChangeHandler = (event) => {
    const { name, value } = event.target;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const onLogin = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(url + '/api/admin/login', { ...data });
      if (response.data.success) {
        const userRole = response.data.user?.role;
        if (userRole === 'admin') {
          const nextToken = response.data.token;
          setToken(nextToken);
          setAdmin(true);
          if (setAppToken) setAppToken(nextToken);
          if (setAppAdmin) setAppAdmin(true);
          localStorage.setItem('token', nextToken);
          localStorage.setItem('admin', 'true');
          toast.success('Admin login successful');
          navigate('/add');
        } else {
          toast.error('Access denied. Admin privileges required.');
        }
      } else {
        console.log('Login failed:', response.data.message);
        toast.error(response.data.message || 'Login failed');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (admin && token) navigate('/add');
  }, [admin, token, navigate]);

  return (
    <div className='login-wrap'>
      <form onSubmit={onLogin} className='login-card'>
        <h2>Admin Login</h2>
        <input name='email' value={data.email} onChange={onChangeHandler} type='email' placeholder='Admin email' required disabled={loading} />
        <input name='password' value={data.password} onChange={onChangeHandler} type='password' placeholder='Password' required disabled={loading} />
        <button type='submit' disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
      </form>
    </div>
  );
};

export default Login;
