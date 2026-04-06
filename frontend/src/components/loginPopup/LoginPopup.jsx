import React, { useState, useContext } from 'react';
import './LoginPopup.css';
import { assets } from '../../assets/assets';
import { StoreContext } from '../../context/StoreContext';
import { toast } from 'react-toastify';

const LoginPopup = ({ setShowLogin }) => {
    const { login, register } = useContext(StoreContext);
    const [currState, setCurrState] = useState("Sign Up");
    const [data, setData] = useState({ name: "", email: "", password: "" });
    const [role, setRole] = useState("user");
    const [message, setMessage] = useState("");

    const onChangeHandler = (e) => setData({ ...data, [e.target.name]: e.target.value });

    const onSubmitHandler = async (e) => {
        e.preventDefault();
        setMessage("");

        let response;
        if (currState === "Sign Up") {
            response = await register(data.name, data.email, data.password, role);
        } else {
            response = await login(data.email, data.password, role);
        }

        if (response.success) {
            toast.success(currState === "Sign Up" ? "Account created successfully!" : "Login successful!");
            setTimeout(() => {
                setShowLogin(false);
                // No need to reload - context already updated in login/register functions
            }, 1200);
        } else {
            setMessage(response.message || "Something went wrong");
        }
    };

    return (
        <div className='login-popup'>
            <form className="login-popup-container" onSubmit={onSubmitHandler}>
                <div className="login-popup-title">
                    <h2>{currState}</h2>
                    <img onClick={() => setShowLogin(false)} src={assets.cross_icon} alt="Close" />
                </div>

                <div className="login-popup-inputs">
                    {currState === "Sign Up" && <input name="name" onChange={onChangeHandler} value={data.name} type="text" placeholder='Your name' required />}
                    <input name="email" onChange={onChangeHandler} value={data.email} type="email" placeholder='Your Email' required />
                    <input name="password" onChange={onChangeHandler} value={data.password} type="password" placeholder='Password' required />
                </div>

                {message && <p className="error-text">{message}</p>}

                <button type="submit" className="submit-btn">
                    {currState === "Sign Up" ? "Create Account" : "Login"}
                </button>

                <div className="switch-text">
                    {currState === "Login" ? (
                        <p>Don't have an account? <span onClick={() => setCurrState("Sign Up")}>Sign Up</span></p>
                    ) : (
                        <p>Already have an account? <span onClick={() => setCurrState("Login")}>Login</span></p>
                    )}
                </div>
            </form>
        </div>
    );
};

export default LoginPopup;