import React, { useContext, useEffect, useState } from 'react';
import './OrderTracking.css';
import { StoreContext } from '../../context/StoreContext';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const OrderTracking = () => {
    const { url, token } = useContext(StoreContext);
    const [searchParams] = useSearchParams();
    const orderIdParam = searchParams.get('orderId');
    
    const [orderId, setOrderId] = useState(orderIdParam || '');
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const fetchOrderDetails = async (id) => {
        if (!id) return;
        setLoading(true);
        try {
            const response = await axios.post(`${url}/api/order/track`, { orderId: id }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setOrder(response.data.data);
            } else {
                toast.error(response.data.message || 'Order not found');
            }
        } catch (error) {
            console.error('Error fetching order', error);
            toast.error(error.response?.data?.message || 'Failed to fetch order details');
            setOrder(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token && orderIdParam) {
            fetchOrderDetails(orderIdParam);
        }
    }, [token, orderIdParam]);

    const handleSearch = (e) => {
        e.preventDefault();
        if (orderId.trim()) {
            navigate(`/ordertracking?orderId=${orderId.trim()}`);
        }
    };

    const getStatusIndex = (status) => {
        const statuses = ['pending', 'processing', 'out_for_delivery', 'delivered'];
        return statuses.indexOf(status);
    };

    return (
        <div className='order-tracking'>
            <div className="order-tracking-header">
                <h2>Track Your Order</h2>
                <form onSubmit={handleSearch} className="tracking-search">
                    <input 
                        type="text" 
                        placeholder="Enter Order ID" 
                        value={orderId} 
                        onChange={(e) => setOrderId(e.target.value)} 
                    />
                    <button type="submit">Track</button>
                </form>
            </div>

            {loading && <div className="loading-spinner">Loading tracking details...</div>}

            {order && !loading && (
                <div className="tracking-details">
                    <div className="order-summary">
                        <h3>Order <span>#{order._id}</span></h3>
                        <p>Placed on: {new Date(order.createdAt).toLocaleString()}</p>
                        <p className="total">Total: ₹{order.amount}</p>
                    </div>

                    <div className="tracking-progress-bar">
                        <div className={`step ${getStatusIndex(order.status) >= 0 ? 'active' : ''}`}>
                            <div className="icon">📝</div>
                            <p>Order Placed</p>
                        </div>
                        <div className={`step ${getStatusIndex(order.status) >= 1 ? 'active' : ''}`}>
                            <div className="icon">🍳</div>
                            <p>Processing</p>
                        </div>
                        <div className={`step ${getStatusIndex(order.status) >= 2 ? 'active' : ''}`}>
                            <div className="icon">🚚</div>
                            <p>Out for Delivery</p>
                        </div>
                        <div className={`step ${getStatusIndex(order.status) >= 3 ? 'active' : ''}`}>
                            <div className="icon">✅</div>
                            <p>Delivered</p>
                        </div>
                    </div>
                    {order.status === 'cancelled' && (
                        <div className="cancelled-notice">
                            This order has been cancelled.
                        </div>
                    )}

                    <div className="order-items-list">
                        <h4>Items in your Order</h4>
                        <ul>
                            {order.items.map((item, idx) => (
                                <li key={idx}>
                                    {item.name} x {item.quantity} <span>₹{item.price * item.quantity}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="delivery-info">
                        <h4>Delivery Address</h4>
                        <p>{order.address.firstName} {order.address.lastName}</p>
                        <p>{order.address.street}, {order.address.city}, {order.address.state} - {order.address.zipcode}</p>
                        <p>Phone: {order.address.phone}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderTracking;
