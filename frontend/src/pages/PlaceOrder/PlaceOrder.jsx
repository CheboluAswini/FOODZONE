import React, { useContext, useState, useEffect } from 'react';
import './PlaceOrder.css';
import { StoreContext } from '../../context/StoreContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const PlaceOrder = () => {
    const { 
        cartItems, 
        food_list, 
        getTotalCartAmount, 
        token, 
        url, 
        setCartItems
    } = useContext(StoreContext);

    const navigate = useNavigate();

    const [data, setData] = useState({
        firstName: "", lastName: "", email: "", street: "", city: "", state: "", zipcode: "", country: "", phone: ""
    });

    const [addresses, setAddresses] = useState([]);
    const [selectedAddressId, setSelectedAddressId] = useState('new');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (getTotalCartAmount() === 0) {
            navigate('/cart');
        }
    }, [token, getTotalCartAmount, navigate]);

    useEffect(() => {
        if (token) {
            fetchAddresses();
        }
    }, [token]);

    const fetchAddresses = async () => {
        try {
            const response = await axios.get(`${url}/api/user/address`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.data.success && response.data.data && response.data.data.length > 0) {
                setAddresses(response.data.data);
                setSelectedAddressId(response.data.data[0]._id);
            }
        } catch (error) {
            console.error('Failed to fetch addresses', error);
        }
    };

    const onChangeHandler = (e) => {
        setData({ ...data, [e.target.name]: e.target.value });
    };

    const getOrderItems = () => {
        const items = [];
        for (const itemId in cartItems) {
            if (cartItems[itemId] > 0) {
                const itemInfo = food_list.find(product => product._id === itemId);
                if (itemInfo) {
                    items.push({
                        foodId: itemId,
                        name: itemInfo.name,
                        price: itemInfo.price,
                        quantity: cartItems[itemId]
                    });
                }
            }
        }
        return items;
    };

    const placeOrder = async (e) => {
        e.preventDefault();

        // Important: Check if user is logged in
        if (!token) {
            toast.error("Please login first to place an order");
            navigate('/');
            return;
        }

        setLoading(true);

        let addressToUse = data;
        
        if (selectedAddressId !== 'new') {
            const selected = addresses.find(a => a._id === selectedAddressId);
            if (selected) {
                 addressToUse = selected;
            }
        }

        const orderData = {
            items: getOrderItems(),
            amount: getTotalCartAmount() === 0 ? 0 : getTotalCartAmount() + 2 + Math.round(getTotalCartAmount() * 0.05),
            address: addressToUse
        };

        try {
            const finalAmount = getTotalCartAmount() === 0 ? 0 : getTotalCartAmount() + 2 + Math.round(getTotalCartAmount() * 0.05);
            const response = await axios.post(`${url}/api/order/place`, orderData, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data.success) {
                navigate('/payment', { state: { orderId: response.data.orderId, amount: finalAmount } });
            } else {
                toast.error(response.data.message || "Failed to place order");
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form className='place-order' onSubmit={placeOrder}>
            <div className="place-order-left">
                <p className="title">Delivery Information</p>
                
                {addresses.length > 0 && (
                    <div className="address-selection">
                        <h4>Select Delivery Address</h4>
                        {addresses.map(addr => (
                            <div 
                                key={addr._id} 
                                className={`address-card ${selectedAddressId === addr._id ? 'selected' : ''}`}
                                onClick={() => setSelectedAddressId(addr._id)}
                            >
                                <input 
                                    type="radio" 
                                    name="addressSelection" 
                                    checked={selectedAddressId === addr._id}
                                    onChange={() => setSelectedAddressId(addr._id)}
                                />
                                <div>
                                    <p><b>{addr.firstName} {addr.lastName}</b> - {addr.phone}</p>
                                    <p>{addr.street}, {addr.city}, {addr.state}, {addr.zipcode}, {addr.country}</p>
                                </div>
                            </div>
                        ))}
                        
                        <div 
                            className={`address-card ${selectedAddressId === 'new' ? 'selected' : ''}`}
                            onClick={() => setSelectedAddressId('new')}
                        >
                             <input 
                                type="radio" 
                                name="addressSelection" 
                                checked={selectedAddressId === 'new'}
                                onChange={() => setSelectedAddressId('new')}
                            />
                            <b>Add New Address</b>
                        </div>
                    </div>
                )}

                {selectedAddressId === 'new' && (
                    <div className="new-address-form">
                        <div className="multi-fields">
                            <input name="firstName" onChange={onChangeHandler} value={data.firstName} type="text" placeholder='First name' required />
                            <input name="lastName" onChange={onChangeHandler} value={data.lastName} type="text" placeholder='Last name' required />
                        </div>
                        <input name="email" onChange={onChangeHandler} value={data.email} type="email" placeholder='Email address' required />
                        <input name="street" onChange={onChangeHandler} value={data.street} type="text" placeholder='Street' required />
                        <div className="multi-fields">
                            <input name="city" onChange={onChangeHandler} value={data.city} type="text" placeholder='City' required />
                            <input name="state" onChange={onChangeHandler} value={data.state} type="text" placeholder='State' required />
                        </div>
                        <div className="multi-fields">
                            <input name="zipcode" onChange={onChangeHandler} value={data.zipcode} type="text" placeholder='Zip code' required />
                            <input name="country" onChange={onChangeHandler} value={data.country} type="text" placeholder='Country' required />
                        </div>
                        <input name="phone" onChange={onChangeHandler} value={data.phone} type="text" placeholder='Phone' required />
                    </div>
                )}
            </div>

            <div className="place-order-right">
                <div className="cart-total">
                    <h2>Cart Totals</h2>
                    <div>
                        <div className="cart-total-details"><p>Subtotal</p><p>₹{getTotalCartAmount()}</p></div>
                        <hr />
                        <div className="cart-total-details"><p>GST (5%)</p><p>₹{Math.round(getTotalCartAmount() * 0.05)}</p></div>
                        <hr />
                        <div className="cart-total-details"><p>Delivery Fee</p><p>₹2</p></div>
                        <hr />
                        <div className="cart-total-details"><b>Total</b><b>₹{getTotalCartAmount() === 0 ? 0 : getTotalCartAmount() + 2 + Math.round(getTotalCartAmount() * 0.05)}</b></div>
                    </div>

                    <button type="submit" disabled={loading || getTotalCartAmount() === 0}>
                        {loading ? "Processing..." : "PROCEED TO PAYMENT"}
                    </button>
                </div>
            </div>
        </form>
    );
};

export default PlaceOrder;
