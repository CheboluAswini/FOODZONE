import React from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = () => {
  return (
    <div className='sidebar'>
      <NavLink to='/add' className='item'>Add Item</NavLink>
      <NavLink to='/list' className='item'>List Items</NavLink>
      <NavLink to='/orders' className='item'>Orders</NavLink>
      <NavLink to='/profile' className='item'>Profile</NavLink>
    </div>
  );
};

export default Sidebar;
