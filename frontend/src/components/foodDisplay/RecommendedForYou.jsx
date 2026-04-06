import React, { useContext, useEffect, useState } from 'react';
import './FoodDisplay.css';
import { StoreContext } from '../../context/StoreContext';
import FoodItem from '../foodItem/FoodItem';

const RecommendedForYou = () => {
    const { food_list, url } = useContext(StoreContext);
    const [recommendations, setRecommendations] = useState([]);

    useEffect(() => {
        const fetchRecommendations = async () => {
            try {
                const token = localStorage.getItem('token') || '';
                const response = await fetch(`${url}/api/ml/recommendations`, {
                    headers: { 'token': token }
                });
                const data = await response.json();
                
                // Directly use the ML-scored items from the backend
                if (data.success && data.data && data.data.length > 0) {
                    setRecommendations(data.data);
                } else {
                    setRecommendations([]); // Hide if no items > 85%
                }
            } catch (error) {
                console.error("Failed to fetch ML recommendations", error);
            }
        };

        if (food_list && food_list.length > 0) {
            fetchRecommendations();
        }
    }, [food_list, url]);

    if (recommendations.length === 0) {
        return (
            <div className='food-display' id='recommendations' style={{ textAlign: "center", padding: "20px" }}>
                <h2>[ AI Recommendations ]</h2>
                <p>No food items currently meet the strict 85% match condition.</p>
            </div>
        );
    }

    return (
        <div className='food-display' id='recommendations'>
            <h2>[ AI Recommended For You ]</h2>
            <div style={{ display: "flex", flexDirection: "row", gap: "20px", overflowX: "auto", paddingBottom: "15px" }}>
                {recommendations.map((item, index) => (
                    <div key={index} style={{ minWidth: "250px", flexShrink: 0 }}>
                        <div style={{ color: "#FF6347", fontWeight: "bold", fontSize: "14px", marginBottom: "8px" }}>
                            > Reason: {item.ml_reason || "Based on your behavior"} <br/> (Match: {Math.round(item.ml_score * 100)}%)
                        </div>
                        <FoodItem 
                            id={item._id}
                            name={item.name}
                            description={item.description}
                            price={item.price}
                            image={item.image}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RecommendedForYou;