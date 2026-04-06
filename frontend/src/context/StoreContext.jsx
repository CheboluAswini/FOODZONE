import { createContext, useEffect, useState, useMemo } from "react";
import axios from "axios";

export const StoreContext = createContext(null);

const StoreContextProvider = (props) => {
    const [food_list, setFoodList] = useState([]);
    const [cartItems, setCartItems] = useState(() => {
        const storedCart = localStorage.getItem("cartItems");
        return storedCart ? JSON.parse(storedCart) : {};
    });
    const [token, setToken] = useState(localStorage.getItem('token') || "");
    const [userName, setUserName] = useState(localStorage.getItem('userName') || "User");
    const [userRole, setUserRole] = useState(localStorage.getItem('userRole') || "user");
    const [searchTerm, setSearchTerm] = useState("");
    
    // Add savedAddress state with localStorage persistence
    const [savedAddress, setSavedAddress] = useState(() => {
        const stored = localStorage.getItem('savedAddress');
        return stored ? JSON.parse(stored) : {
            street: "",
            city: "",
            state: "",
            zipCode: "",
            country: "",
            phone: ""
        };
    });

    // Use environment variable for backend URL
    const url = import.meta.env.VITE_API_URL || "http://localhost:5000";

    const getTotalCartItems = () => {
        let total = 0;
        for (const item in cartItems) total += cartItems[item];
        return total;
    };

    const login = async (email, password, role = "user") => {
        try {
            const response = await axios.post(`${url}/api/user/login`, { email, password, role });
            if (response.data.success) {
                setToken(response.data.token);
                // Use actual user data from backend response
                const userData = response.data.user;
                setUserName(userData?.name || "User");
                setUserRole(userData?.role || "user");
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('userName', userData?.name || "User");
                localStorage.setItem('userRole', userData?.role || "user");
                return { success: true, user: userData };
            }
            return { success: false, message: response.data.message };
        } catch (error) {
            return { 
                success: false, 
                message: error.response?.data?.message || "Login failed" 
            };
        }
    };

    const register = async (name, email, password, role = "user") => {
        try {
            const response = await axios.post(`${url}/api/user/register`, { name, email, password, role });
            if (response.data.success) {
                setToken(response.data.token || "");
                // Use actual user data from backend response
                const userData = response.data.user;
                setUserName(userData?.name || name);
                setUserRole(userData?.role || "user");
                localStorage.setItem('token', response.data.token || "");
                localStorage.setItem('userName', userData?.name || name);
                localStorage.setItem('userRole', userData?.role || "user");
                return { success: true, user: userData };
            }
            return { success: false, message: response.data.message };
        } catch (error) {
            return { 
                success: false, 
                message: error.response?.data?.message || "Registration failed" 
            };
        }
    };

    const logout = () => {
        setToken("");
        setUserName("User");
        setUserRole("user");
        setCartItems({});
        localStorage.clear();
        window.location.href = "/";
    };

    const addToCart = (itemId) => setCartItems(prev => ({ ...prev, [itemId]: prev[itemId] ? prev[itemId] + 1 : 1 }));

    const removeFromCart = (itemId) => {
        setCartItems(prev => {
            const newCart = { ...prev };
            if (newCart[itemId] > 1) newCart[itemId] -= 1;
            else delete newCart[itemId];
            return newCart;
        });
    };

    const getTotalCartAmount = () => {
        let total = 0;
        for (const item in cartItems) {
            if (cartItems[item] > 0) {
                const itemInfo = food_list.find(product => product._id === item);
                if (itemInfo) total += itemInfo.price * cartItems[item];
            }
        }
        return total;
    };

    useEffect(() => {
        window.localStorage.setItem('cartItems', JSON.stringify(cartItems));
    }, [cartItems]);

    // Persist savedAddress to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('savedAddress', JSON.stringify(savedAddress));
    }, [savedAddress]);

    const fetchFoodList = async () => {
        try {
            const response = await axios.get(`${url}/api/food/list`);
            if (response.data.success) {
                setFoodList(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching food list", error);
        }
    };

    const loadCartData = async (tokenParam) => {
        // Redundant - mapped to initial state
    };

    useEffect(() => {
        async function loadData() {
            await fetchFoodList();
        }
        loadData();
    }, []);

    // Memoize context value to prevent unnecessary re-renders
    const contextValue = useMemo(() => ({
        food_list,
        cartItems,
        setCartItems,
        addToCart,
        removeFromCart,
        getTotalCartAmount,
        getTotalCartItems,
        url,
        token,
        userName,
        userRole,
        login,
        register,
        logout,
        searchTerm,
        setSearchTerm,
        savedAddress,
        setSavedAddress
    }), [food_list, cartItems, token, userName, userRole, searchTerm, savedAddress, url]);

    return (
        <StoreContext.Provider value={contextValue}>
            {props.children}
        </StoreContext.Provider>
    );
};

export default StoreContextProvider;