import React, { useContext, useEffect, useState } from 'react';
import './Profile.css';
import { StoreContext } from '../../context/StoreContext';
import axios from 'axios';
import { toast } from 'react-toastify';

const Profile = () => {
    const { url, token } = useContext(StoreContext);
    const [data, setData] = useState({
        name: '',
        email: '',
        phone: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (token) {
            fetchUserProfile();
        }
    }, [token]);

    const fetchUserProfile = async () => {
        try {
            const response = await axios.get(`${url}/api/user/profile`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setData({
                    name: response.data.data.name || '',
                    email: response.data.data.email || '',
                    phone: response.data.data.phone || ''
                });
            } else {
                toast.error("Failed to load profile");
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to load profile");
        } finally {
            setLoading(false);
        }
    };

    const onChangeHandler = (event) => {
        const { name, value } = event.target;
        setData(prev => ({ ...prev, [name]: value }));
    };

    const onSubmitHandler = async (event) => {
        event.preventDefault();
        setSaving(true);
        try {
            const response = await axios.put(`${url}/api/user/profile`, 
                { name: data.name, phone: data.phone },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.data.success) {
                toast.success("Profile updated successfully!");
                setData({
                    ...data,
                    name: response.data.data.name,
                    phone: response.data.data.phone
                });
            } else {
                toast.error("Update failed");
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Update failed");
        } finally {
            setSaving(false);
        }
    };

    if (!token) {
        return <div className="profile-container"><p>Please login to view your profile.</p></div>;
    }

    return (
        <div className='profile-container'>
            <div className='profile-card'>
                <h2>Your Profile</h2>
                <p>Update your personal information here.</p>
                {loading ? (
                    <div className="profile-loader">Loading...</div>
                ) : (
                    <form onSubmit={onSubmitHandler} className='profile-form'>
                        <div className="form-group">
                            <label>Name</label>
                            <input 
                                type="text" 
                                name="name" 
                                value={data.name} 
                                onChange={onChangeHandler} 
                                required 
                            />
                        </div>
                        <div className="form-group">
                            <label>Email <span className="readonly-badge">(Read Only)</span></label>
                            <input 
                                type="email" 
                                name="email" 
                                value={data.email} 
                                disabled 
                                className="disabled-input"
                            />
                        </div>
                        <div className="form-group">
                            <label>Phone Number</label>
                            <input 
                                type="tel" 
                                name="phone" 
                                value={data.phone} 
                                onChange={onChangeHandler} 
                                placeholder="Enter phone number" 
                            />
                        </div>
                        <button type="submit" disabled={saving}>
                            {saving ? "Saving..." : "Save Changes"}
                        </button>
                    </form>
                )}
            </div>
        </div>
    )
}

export default Profile;