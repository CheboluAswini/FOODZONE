import React, { useContext } from 'react';
import './FoodDisplay.css';
import { StoreContext } from '../../context/StoreContext';
import FoodItem from '../FoodItem/FoodItem';

const FoodDisplay = ({ category }) => {
    const { food_list, searchTerm } = useContext(StoreContext);
    
    const filteredFoods = food_list.filter(item => {
        // Match search term
        const matchesSearch = !searchTerm || 
            item.name.toLowerCase().includes(searchTerm.toLowerCase());
        
        // Match category (if category is "All" or not set, show all)
        const matchesCategory = !category || category === "All" || item.category === category;
        
        return matchesSearch && matchesCategory;
    });

    return (
        <div className='food-display' id='explore-menu'>
            <h2>Top dishes near you</h2>
            <div className="food-display-list">
                {filteredFoods.length > 0 ? (
                    filteredFoods.map((item) => (
                        <FoodItem 
                            key={item._id} 
                            id={item._id}
                            name={item.name}
                            description={item.description}
                            price={item.price}
                            image={item.image}
                        />
                    ))
                ) : (
                    <p>No dishes found</p>
                )}
            </div>
        </div>
    );
};

export default FoodDisplay;