import React, { useState, useContext } from 'react';
import './Home.css';
import Header from '../../components/Header/Header';
import ExploreMenu from '../../components/ExploreMenu/ExploreMenu';
import FoodDisplay from '../../components/foodDisplay/FoodDisplay';
import AppDownload from '../../components/AppDownload/AppDownload';
import { StoreContext } from '../../context/StoreContext';

const Home = () => {
    const [category, setCategory] = useState("All");
    const { searchTerm, setSearchTerm } = useContext(StoreContext) || {};   // Safe fallback

    return (
        <div>
            <Header />

            {/* Professional Search Bar */}
            {/* <div className="search-bar-container">
                <div className="search-bar">
                    <input
                        type="text"
                        placeholder="Search for food items..."
                        value={searchTerm || ""}
                        onChange={(e) => setSearchTerm && setSearchTerm(e.target.value)}
                    />
                </div>
            </div> */}

            <ExploreMenu category={category} setCategory={setCategory} />
            <FoodDisplay category={category} />
            <AppDownload />
        </div>
    );
};

export default Home;