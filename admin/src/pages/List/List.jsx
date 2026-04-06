import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './List.css';

const List = ({ url, token }) => {
  const [list, setList] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const fetchList = async () => {
    try {
      const response = await axios.get(`${url}/api/food/list`);
      if (response.data.success) setList(response.data.data);
      else toast.error(response.data.message || 'Error fetching food list');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error fetching food list');
    }
  };

  const removeFood = async (foodId) => {
    try {
      const response = await axios.post(
        `${url}/api/food/remove`,
        { id: foodId },
        { headers: { Authorization: `Bearer ${token}`, token } }
      );
      if (response.data.success) {
        toast.success('Item removed');
        const newList = list.filter(item => item._id !== foodId);
        setList(newList);
        
        // Handle current page items going empty
        const totalPages = Math.ceil(newList.length / itemsPerPage);
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(totalPages);
        }
      } else {
        toast.error(response.data.message || 'Failed to remove item');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Remove failed');
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = list.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(list.length / itemsPerPage);

  const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className='list'>
      <h2>All Foods</h2>
      <div className='list-grid'>
        {currentItems.map((item) => (
          <div className='row' key={item._id}>
            <img src={`${url}/images/${item.image}`} alt={item.name} />
            <p>{item.name}</p>
            <p>Rs {item.price}</p>
            <button onClick={() => removeFood(item._id)}>Remove</button>
          </div>
        ))}
      </div>
      
      {totalPages > 1 && (
          <div className="pagination">
              <button 
                  disabled={currentPage === 1} 
                  onClick={() => handlePageChange(currentPage - 1)}
              >
                  Prev
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button 
                      key={page} 
                      className={currentPage === page ? 'active' : ''}
                      onClick={() => handlePageChange(page)}
                  >
                      {page}
                  </button>
              ))}
              
              <button 
                  disabled={currentPage === totalPages} 
                  onClick={() => handlePageChange(currentPage + 1)}
              >
                  Next
              </button>
          </div>
      )}
    </div>
  );
};

export default List;
