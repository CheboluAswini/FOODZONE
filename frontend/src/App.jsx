import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar';
import Home from './pages/Home/Home';
import Cart from './pages/Cart/Cart';
import PlaceOrder from './pages/PlaceOrder/PlaceOrder';
import Payment from './pages/Payment/Payment';
import Profile from './pages/Profile/Profile';
import MyOrders from './pages/MyOrders/MyOrders';
import SavedAddress from './pages/SavedAddress/SavedAddress';
import OrderTracking from './pages/OrderTracking/OrderTracking';
import Footer from './components/footer/Footer';
import LoginPopup from './components/loginPopup/LoginPopup';
import StoreContextProvider from './context/StoreContext';
import Chatbot from './components/Chatbot/Chatbot';

const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    return token ? children : <Navigate to="/" />;
};

const App = () => {
    const [showLogin, setShowLogin] = useState(false);

    return (
        <StoreContextProvider>
            <>
                {showLogin && <LoginPopup setShowLogin={setShowLogin} />}

                <div className="app">
                    <Navbar setShowLogin={setShowLogin} />

                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/cart" element={<Cart />} />
                        <Route path="/order" element={<ProtectedRoute><PlaceOrder /></ProtectedRoute>} />
                        <Route path="/payment" element={<ProtectedRoute><Payment /></ProtectedRoute>} />
                        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                        <Route path="/myorders" element={<ProtectedRoute><MyOrders /></ProtectedRoute>} />
                        <Route path="/savedaddress" element={<ProtectedRoute><SavedAddress /></ProtectedRoute>} />
                        <Route path="/ordertracking" element={<ProtectedRoute><OrderTracking /></ProtectedRoute>} />
                    </Routes>
                </div>

                <Chatbot />
                <Footer />
            </>
        </StoreContextProvider>
    );
};

export default App;