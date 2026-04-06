import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { StoreContext } from '../../context/StoreContext';
import { assets } from '../../assets/assets';
import './Add.css';

const Add = ({ url }) => {
  const navigate = useNavigate();
  const { token, admin } = useContext(StoreContext);
  const [image, setImage] = useState(null);
  const [data, setData] = useState({ name: '', description: '', price: '', category: 'Salad' });

  const onChangeHandler = (event) => {
    const { name, value } = event.target;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    if (!image) return toast.error('Please select an image');

    try {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('description', data.description);
      formData.append('price', Number(data.price));
      formData.append('category', data.category);
      formData.append('image', image);

      const response = await axios.post(`${url}/api/food/add`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          token
        }
      });

      if (response.data.success) {
        setData({ name: '', description: '', price: '', category: 'Salad' });
        setImage(null);
        toast.success('Item added');
      } else {
        toast.error(response.data.message || 'Failed to add item');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error adding item');
    }
  };

  useEffect(() => {
    if (!admin || !token) {
      toast.error('Please login first');
      navigate('/');
    }
  }, [admin, token, navigate]);

  return (
    <div className='add'>
      <form onSubmit={onSubmitHandler} className='add-form'>
        <div className='add-img-upload'>
          <p>Upload image</p>
          <label htmlFor='image'>
            <img src={image ? URL.createObjectURL(image) : assets.upload_area} alt='upload' />
          </label>
          <input onChange={(e) => setImage(e.target.files[0])} type='file' id='image' hidden required />
        </div>
        <input onChange={onChangeHandler} value={data.name} type='text' name='name' placeholder='Product name' required />
        <textarea onChange={onChangeHandler} value={data.description} name='description' rows='5' placeholder='Description' required />
        <select name='category' required onChange={onChangeHandler} value={data.category}>
          <option value='Salad'>Salad</option>
          <option value='Rolls'>Rolls</option>
          <option value='Deserts'>Deserts</option>
          <option value='Sandwich'>Sandwich</option>
          <option value='Cake'>Cake</option>
          <option value='Pure Veg'>Pure Veg</option>
          <option value='Pasta'>Pasta</option>
          <option value='Rice'>Rice Items</option>
          <option value='Noodles'>Noodles</option>
        </select>
        <input onChange={onChangeHandler} value={data.price} type='number' name='price' placeholder='Price' required />
        <button type='submit'>Add</button>
      </form>
    </div>
  );
};

export default Add;
