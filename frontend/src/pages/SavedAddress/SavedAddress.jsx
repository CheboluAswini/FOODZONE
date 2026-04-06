import React, { useContext, useEffect, useState } from 'react';
import './SavedAddress.css';
import { StoreContext } from '../../context/StoreContext';
import axios from 'axios';
import { toast } from 'react-toastify';

const SavedAddress = () => {
    const { url, token } = useContext(StoreContext);
    const [addresses, setAddresses] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
        phone: ''
    });

    useEffect(() => {
        if (token) {
            fetchAddresses();
        }
    }, [token]);

    const fetchAddresses = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${url}/api/user/address`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setAddresses(response.data.data);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error fetching addresses');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const addAddress = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(`${url}/api/user/address`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                toast.success('Address saved successfully!');
                setAddresses(response.data.data);
                setShowForm(false);
                setFormData({ street: '', city: '', state: '', zipCode: '', country: '', phone: '' });
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error saving address');
        }
    };

    const removeAddress = async (addressId) => {
        try {
            const response = await axios.delete(`${url}/api/user/address/${addressId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                toast.success('Address removed');
                setAddresses(response.data.data);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error removing address');
        }
    };

    if (!token) {
        return <div className="saved-addr-container"><p>Please login to view saved addresses.</p></div>;
    }

    return (
        <div className='saved-addr-container'>
            <div className='saved-addr-card'>
                <div className='saved-addr-header'>
                    <h2>My Addresses</h2>
                    <button onClick={() => setShowForm(!showForm)} className="add-new-btn">
                        {showForm ? 'Close' : '+ Add New Address'}
                    </button>
                </div>

                {showForm && (
                    <form className="address-form" onSubmit={addAddress}>
                        <h4>Add A New Delivery Address</h4>
                        <input name="street" onChange={handleInputChange} value={formData.street} type="text" placeholder="Street Address" required />
                        <div className="form-row">
                            <input name="city" onChange={handleInputChange} value={formData.city} type="text" placeholder="City" required />
                            <input name="state" onChange={handleInputChange} value={formData.state} type="text" placeholder="State" required />
                        </div>
                        <div className="form-row">
                            <input name="zipCode" onChange={handleInputChange} value={formData.zipCode} type="text" placeholder="Zip Code" required />
                            <input name="country" onChange={handleInputChange} value={formData.country} type="text" placeholder="Country" required />
                        </div>
                        <input name="phone" onChange={handleInputChange} value={formData.phone} type="text" placeholder="Contact Phone" required />
                        <button type="submit" className="save-addr-btn">Save Address</button>
                    </form>
                )}

                {loading ? (
                    <div className="loader">Loading addresses...</div>
                ) : addresses.length === 0 ? (
                    <div className="empty-addresses">
                        <img src="https://cdni.iconscout.com/illustration/premium/thumb/empty-cart-2130356-1800917.png" alt="No addresses" width="120" />
                        <p>You have not saved any addresses yet.</p>
                    </div>
                ) : (
                    <div className="address-list">
                        {addresses.map((addr) => (
                            <div className="address-item" key={addr._id}>
                                <div className="addr-details">
                                    <p className="addr-street">{addr.street}</p>
                                    <p>{addr.city}, {addr.state} {addr.zipCode}</p>
                                    <p>{addr.country}</p>
                                    <p className="addr-phone">Phone: {addr.phone}</p>
                                </div>
                                <button className="delete-addr-btn" onClick={() => removeAddress(addr._id)}>Remove</button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default SavedAddress;