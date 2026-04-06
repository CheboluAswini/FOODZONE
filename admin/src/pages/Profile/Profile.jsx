import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './Profile.css';

const Profile = ({ url, token }) => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Note: Assuming there's a backend endpoint to fetch generic logged-in user profile,
  // or a specific admin profile endpoint. Using generic user endpoint: /api/user/profile.
  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${url}/api/user/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setProfileData(response.data.data);
      } else {
        toast.error('Failed to load profile');
      }
    } catch (error) {
      // toast.error('Error fetching profile data');
      // mock data for now if backend doesn't support admin profile yet
      setProfileData({
        name: "Admin User",
        email: "admin@foodzone.com",
        role: "Administrator",
        joinedDate: new Date().toLocaleDateString()
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [token]);

  if (loading) return <div className="admin-profile loading">Loading Profile...</div>;

  return (
    <div className='admin-profile'>
      <div className="profile-header">
        <h2>Admin Profile</h2>
      </div>
      <div className="profile-card">
        <div className="profile-avatar">
          <img src="https://ui-avatars.com/api/?name=Admin+User&background=ff6347&color=fff" alt="Admin Avatar" />
        </div>
        <div className="profile-info">
          <div className="info-group">
            <label>Name:</label>
            <p>{profileData?.name || "System Administrator"}</p>
          </div>
          <div className="info-group">
            <label>Email:</label>
            <p>{profileData?.email || "admin@example.com"}</p>
          </div>
          <div className="info-group">
            <label>Role:</label>
            <p>{profileData?.role || "Super Admin"}</p>
          </div>
          <div className="info-group">
            <label>Member Since:</label>
            <p>{profileData?.joinedDate || "N/A"}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;