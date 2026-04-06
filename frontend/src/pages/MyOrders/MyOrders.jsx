import React, { useContext, useEffect, useState } from 'react';
import './MyOrders.css';
import { StoreContext } from '../../context/StoreContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { assets } from '../../assets/assets'; // if parcel icon is there

const MyOrders = () => {
    const { url, token, setCartItems } = useContext(StoreContext);
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const queryParams = new URLSearchParams(window.location.search);
        if (queryParams.get('payment') === 'success') {
            setCartItems?.({});
            // clean up url optionally
            window.history.replaceState(null, '', '/myorders');
        }
    }, [setCartItems]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${url}/api/order/userorders`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setData(response.data.data);
            }
        } catch (error) {
            toast.error("Failed to fetch orders");
            console.error("Error fetching orders:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchOrders();
        } else {
            setLoading(false);
        }
    }, [token]);

    return (
        <div className='my-orders'>
            <h2>My Orders</h2>
            
            {loading ? (
                <div className="orders-loading">Loading your orders...</div>
            ) : data.length === 0 ? (
                <div className="no-orders">
                    <p>You have no recent orders.</p>
                    <button onClick={() => navigate('/')}>Explore Menu</button>
                </div>
            ) : (
                <div className="container">
                    {data.map((order, index) => {
                        return (
                            <div key={index} className='my-orders-order'>
                                <img src={assets.parcel_icon || "https://cdn-icons-png.flaticon.com/512/3233/3233878.png"} alt="parcel" />
                                <p className='order-items-string'>
                                    {order.items.map((item, index) => {
                                        if (index === order.items.length - 1) {
                                            return item.name + " x " + item.quantity;
                                        } else {
                                            return item.name + " x " + item.quantity + ", ";
                                        }
                                    })}
                                </p>
                                <p className='order-amount'>₹{order.amount}</p>
                                <p className='order-items-count'>Items: {order.items.length}</p>
                                <p><span>&#x25cf;</span> <b className={order.status}>{order.status.replace(/_/g, ' ')}</b></p>
                                <button onClick={() => navigate(`/ordertracking?orderId=${order._id}`)}>Track Order</button>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    );
};

export default MyOrders;
