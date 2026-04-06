import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { assets } from '../../assets/assets';
import { StoreContext } from '../../context/StoreContext';
import './Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const { token, admin, setToken, setAdmin } = useContext(StoreContext);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('admin');
    setToken('');
    setAdmin(false);
    toast.success('Logged out');
    navigate('/');
  };

  return (
    <div className='navbar'>
      <img className='logo' src={assets.logo1} alt='logo' />
      {token && admin ? (
        <button className='link-btn' onClick={logout}>Logout</button>
      ) : (
        <button className='link-btn' onClick={() => navigate('/')}>Login</button>
      )}
      <img className='profile' src={assets.profile_image} alt='admin' />
    </div>
  );
};

export default Navbar;
