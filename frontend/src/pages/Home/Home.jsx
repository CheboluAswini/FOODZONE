import React, { useState, useContext } from 'react';
import './Home.css';
import Header from '../../components/Header/Header';
import ExploreMenu from '../../components/ExploreMenu/ExploreMenu';
import FoodDisplay from '../../components/foodDisplay/FoodDisplay';
import RecommendedForYou from '../../components/foodDisplay/RecommendedForYou';
import AppDownload from '../../components/AppDownload/AppDownload';
import { StoreContext } from '../../context/StoreContext';

const Home = () => {
    const [category, setCategory] = useState("All");
    const { searchTerm, setSearchTerm } = useContext(StoreContext) || {};   // Safe fallback

    return (
        <div>
            <Header />
            
            <ExploreMenu category={category} setCategory={setCategory} />
            
            <div className="home-sections-container">
                {/* Section 1: AI Recommendations */}
                <div className="home-recommendations-section">
                    <RecommendedForYou />
                </div>

                {/* Section 2: Original Menu */}
                <div className="home-menu-section">
                    <FoodDisplay category={category} />
                </div>
            </div>

            <AppDownload />
        </div>
    );
};

export default Home;