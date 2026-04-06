import React, { useState, useContext } from 'react';
import './Navbar.css';
import { assets } from '../../assets/assets';
import { Link, useNavigate } from 'react-router-dom';
import { StoreContext } from '../../context/StoreContext';

const Navbar = ({ setShowLogin }) => {
    const [menu, setMenu] = useState("home");
    const [isSearching, setIsSearching] = useState(false);
    const { getTotalCartItems, token, logout, searchTerm, setSearchTerm } = useContext(StoreContext);
    const navigate = useNavigate();

    const handleSearchClick = () => {
        setIsSearching(true);
        navigate('/#explore-menu');
    };

    return (
        <div className='navbar'>
            <Link to='/'><img src={assets.logo} alt="" className="logo" /></Link>
            <ul className="navbar-menu">
                <Link to='/' onClick={() => setMenu("home")} className={menu === "home" ? "active" : ""}>home</Link>
                <a href='/#explore-menu' onClick={() => setMenu("menu")} className={menu === "menu" ? "active" : ""}>menu</a>
                <a href='/#app-download' onClick={() => setMenu("mobile-app")} className={menu === "mobile-app" ? "active" : ""}>mobile-app</a>
                <a href='/#footer' onClick={() => setMenu("contact-us")} className={menu === "contact-us" ? "active" : ""}>contact us</a>
            </ul>
            <div className="navbar-right">
                <div className="navbar-search">
                    {isSearching ? (
                        <div className="search-input-container">
                            <input 
                                type="text" 
                                placeholder="Search foods..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                autoFocus
                                onBlur={(e) => {
                                    if(e.target.value === '') setIsSearching(false);
                                }}
                            />
                            <span className="search-close" onClick={() => { setSearchTerm(''); setIsSearching(false); }}>&#x2715;</span>
                        </div>
                    ) : (
                        <img src={assets.search_icon} alt="" onClick={handleSearchClick} style={{ cursor: 'pointer' }} />
                    )}
                </div>
                <div className="navbar-search-icon">
                    <Link to='/cart'><img src={assets.basket_icon} alt="" /></Link>
                    <div className={getTotalCartItems() === 0 ? "" : "dot"}></div>
                </div>
                {!token ? <button onClick={() => setShowLogin(true)}>sign in</button>
                    : <div className='navbar-profile'>
                        <img src={assets.profile_icon} alt="" />
                        <ul className="nav-profile-dropdown">
                            <li onClick={() => navigate('/profile')}><img src={assets.profile_icon} alt="" /><p>Profile</p></li>
                            <hr />
                            <li onClick={() => navigate('/myorders')}><img src={assets.bag_icon} alt="" /><p>Orders</p></li>
                            <hr />
                            <li onClick={() => navigate('/savedaddress')}><img src={assets.selector_icon} alt="" /><p>Addresses</p></li>
                            <hr />
                            <li onClick={() => navigate('/ordertracking')}><img src={assets.parcel_icon} alt="" /><p>Tracking</p></li>
                            <hr />
                            <li onClick={logout}><img src={assets.logout_icon} alt="" /><p>Logout</p></li>
                        </ul>
                    </div>}
            </div>
        </div>
    );
};

export default Navbar;
