import React, { useEffect, useState } from 'react'; 
import axios from 'axios'; 
import { toast } from 'react-toastify'; 
import { assets } from '../../assets/assets'; 
import './Orders.css';  

const Orders = ({ url, token }) => {   
  const [orders, setOrders] = useState([]);   
  const [orderIdSearch, setOrderIdSearch] = useState('');   
  const [currentPage, setCurrentPage] = useState(1);   
  const [totalPages, setTotalPages] = useState(1);    

  const fetchAllOrders = async () => {     
    try {       
      const response = await axios.get(url + '/api/order/list', {         
        headers: {           
          Authorization: `Bearer ${token}`,           
          token         
        },         
        params: {           
          page: currentPage,           
          limit: 10,           
          orderId: orderIdSearch         
        }       
      });       
      if (response.data.success) {         
        setOrders(response.data.data);         
        setTotalPages(response.data.totalPages || 1);       
      } else {         
        toast.error(response.data.message || 'Unable to fetch orders');       
      }     
    } catch (error) {       
      toast.error(error.response?.data?.message || 'Unable to fetch orders');        
    }   
  };    

  const handleSearchChange = (e) => {     
    setOrderIdSearch(e.target.value);   
  };    

  const handleSearchSubmit = (e) => {     
    e.preventDefault();     
    setCurrentPage(1);     
    fetchAllOrders();   
  };  // ✅ properly closed here

  const statusHandler = async (event, orderId) => {     
    try {       
      const response = await axios.post(         
        url + '/api/order/status',         
        { orderId, status: event.target.value },         
        { headers: { Authorization: `Bearer ${token}`, token } }       
      );       
      if (response.data.success) {         
        toast.success('Order updated');         
        fetchAllOrders();       
      } else {         
        toast.error(response.data.message || 'Update failed');       
      }     
    } catch (error) {       
      toast.error(error.response?.data?.message || 'Update failed');     
    }   
  };    

  useEffect(() => {     
    fetchAllOrders();   
  }, [currentPage]);    

  const handlePrevPage = () => {     
    if (currentPage > 1) setCurrentPage(currentPage - 1);   
  };    

  const handleNextPage = () => {     
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);   
  };    

  return (     
    <div className='order add'>       
      <h3>Order Page</h3>              

      <form className='order-search' onSubmit={handleSearchSubmit}>         
        <input            
          type='text'            
          placeholder='Enter Order ID'            
          value={orderIdSearch}            
          onChange={handleSearchChange}          
        />         
        <button type='submit'>Search</button>         
        <button type='button' onClick={() => { setOrderIdSearch(''); setCurrentPage(1); fetchAllOrders(); }}>Clear</button>       
      </form>        

      <div className='order-list'>         
        {orders.map((order) => (           
          <div key={order._id} className='order-item'>             
            <img src={assets.parcel_icon} alt='parcel' />             
            <div>               
              <p><strong>Order ID:</strong> {order._id}</p>               
              <p>{order.items.map((item) => `${item.name} x ${item.quantity}`).join(', ')}</p>               
              <p>{order.address?.firstName || ''} {order.address?.lastName || ''}</p>               
              <p>{order.address?.street}, {order.address?.city}</p>               
              <p>{order.address?.phone}</p>             
            </div>             
            <p>Items: {order.items.length}</p>             
            <p>Rs {order.amount}</p>             
            <select value={order.status} onChange={(event) => statusHandler(event, order._id)}>               
              <option value='pending'>Pending</option>               
              <option value='processing'>Processing</option>               
              <option value='out_for_delivery'>Out for delivery</option>                       
              <option value='delivered'>Delivered</option>               
              <option value='cancelled'>Cancelled</option>             
            </select>           
          </div>         
        ))}       
      </div>        

      {totalPages > 1 && (         
        <div className="pagination">           
          <button disabled={currentPage === 1} onClick={handlePrevPage}>Previous</button>           
          <span>Page {currentPage} of {totalPages}</span>           
          <button disabled={currentPage === totalPages} onClick={handleNextPage}>Next</button>         
        </div>       
      )}     
    </div>   
  ); 
};  

export default Orders;