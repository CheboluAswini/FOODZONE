import React, { useContext, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { StoreContext } from '../../context/StoreContext';
import './Payment.css';

const Payment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { token, url, setCartItems } = useContext(StoreContext);
  const [loading, setLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('cod');
  const [upiId, setUpiId] = useState('');
  const [netBankingBank, setNetBankingBank] = useState('');

  const orderId = location.state?.orderId;
  const orderAmount = location.state?.amount;

  const submitPayment = async () => {
    if (!orderId) {
      toast.error('No order found. Place order first.');
      navigate('/order');
      return;
    }

    if (selectedMethod === 'upi' && !upiId.trim()) {
      toast.error('Please enter a valid UPI ID');
      return;
    }

    if (selectedMethod === 'netbanking' && !netBankingBank) {
      toast.error('Please select a bank');
      return;
    }

    try {
      setLoading(true);
      
      if (selectedMethod === 'card') {
        const response = await axios.post(`${url}/api/payment/stripe`, { orderId, amount: orderAmount }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.success && response.data.sessionUrl) {
          window.location.replace(response.data.sessionUrl);
          return;
        } else {
          toast.error(response.data.message || 'Stripe session failed. Is Stripe configured?');
          setLoading(false);
          return;
        }
      }

      const endpoint = selectedMethod === 'cod' ? '/api/payment/cod' : '/api/payment/card';
      let paymentMethodName = 'Card';
      if (selectedMethod === 'upi') paymentMethodName = `UPI (${upiId})`;
      if (selectedMethod === 'netbanking') paymentMethodName = `NetBanking (${netBankingBank})`;
      
      const payload = selectedMethod === 'cod'
        ? { orderId }
        : { orderId, paymentMethod: paymentMethodName };

      const response = await axios.post(`${url}${endpoint}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setCartItems({});
        toast.success(selectedMethod === 'cod' ? 'Order confirmed with Cash on Delivery' : 'Payment successful and order confirmed');
        navigate('/myorders');
      } else {
        toast.error(response.data.message || 'Payment failed');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='payment-container'>
      <h2>Select Payment Method</h2>
      <div className='payment-summary'>
        <p className='order-line'>Order ID: {orderId || 'N/A'}</p>
        <p className='order-line amount-line'>Total Amount: <b>₹{orderAmount || 0}</b></p>
      </div>

      <div className='pay-options'>
        <label className={`pay-option ${selectedMethod === 'cod' ? 'active' : ''}`}>
          <input type='radio' name='pm' checked={selectedMethod === 'cod'} onChange={() => setSelectedMethod('cod')} />
          Cash on Delivery
        </label>
        
        <label className={`pay-option ${selectedMethod === 'upi' ? 'active' : ''}`}>
          <input type='radio' name='pm' checked={selectedMethod === 'upi'} onChange={() => setSelectedMethod('upi')} />
          UPI
        </label>
        {selectedMethod === 'upi' && (
          <div className="payment-input-group">
            <input 
              type="text" 
              placeholder="Enter UPI ID (e.g. user@okicici)" 
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              className="payment-input"
            />
          </div>
        )}

        <label className={`pay-option ${selectedMethod === 'netbanking' ? 'active' : ''}`}>
          <input type='radio' name='pm' checked={selectedMethod === 'netbanking'} onChange={() => setSelectedMethod('netbanking')} />
          NetBanking
        </label>
        {selectedMethod === 'netbanking' && (
          <div className="payment-input-group">
            <select value={netBankingBank} onChange={(e) => setNetBankingBank(e.target.value)} className="payment-select">
              <option value="" disabled>Select Bank</option>
              <option value="SBI">State Bank of India</option>
              <option value="HDFC">HDFC Bank</option>
              <option value="ICICI">ICICI Bank</option>
              <option value="AXIS">Axis Bank</option>
            </select>
          </div>
        )}

        <label className={`pay-option ${selectedMethod === 'card' ? 'active' : ''}`}>
          <input type='radio' name='pm' checked={selectedMethod === 'card'} onChange={() => setSelectedMethod('card')} />
          Credit / Debit Card (Stripe)
        </label>
      </div>

      <button className="confirm-payment-btn" disabled={loading} onClick={submitPayment}>
        {loading ? 'Processing...' : 'Confirm Payment'}
      </button>
    </div>
  );
};

export default Payment;
