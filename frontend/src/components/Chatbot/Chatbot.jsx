import React, { useState, useContext } from 'react';
import './Chatbot.css';
import { StoreContext } from '../../context/StoreContext';

const Chatbot = () => {
    const { url } = useContext(StoreContext);
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { text: "Hi! I am the FoodZone bot. How can I help you today?", isBot: true }
    ]);
    const [input, setInput] = useState('');

    const toggleChat = () => setIsOpen(!isOpen);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = { text: input, isBot: false };
        setMessages(prev => [...prev, userMsg]);
        setInput('');

        // Loading state
        const loadingMsg = { text: "Typing...", isBot: true, isLoading: true };
        setMessages(prev => [...prev, loadingMsg]);

        try {
            const token = localStorage.getItem('token') || '';
            const response = await fetch(`${url}/api/chat/ask`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'token': token
                },
                body: JSON.stringify({ message: input })
            });

            const data = await response.json();
            
            setMessages(prev => {
                const filtered = prev.filter(m => !m.isLoading);
                if (data.success) {
                    return [...filtered, { text: data.answer, isBot: true }];
                } else {
                    return [...filtered, { text: "Sorry, I'm having trouble connecting right now.", isBot: true }];
                }
            });
        } catch (error) {
            console.error("Chat Error:", error);
            setMessages(prev => [
                ...prev.filter(m => !m.isLoading),
                { text: "Connection error. Please try again later.", isBot: true }
            ]);
        }
    };

    return (
        <div className="chatbot-container">
            {isOpen && (
                <div className="chatbot-window">
                    <div className="chatbot-header">
                        <h3>FoodZone Support</h3>
                        <button onClick={toggleChat} className="close-chat-btn">&times;</button>
                    </div>
                    <div className="chatbot-messages">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`chat-message ${msg.isBot ? 'bot' : 'user'}`}>
                                {msg.text}
                            </div>
                        ))}
                    </div>
                    <form className="chatbot-input" onSubmit={handleSend}>
                        <input 
                            type="text" 
                            placeholder="Type a message..." 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                        />
                        <button type="submit">Send</button>
                    </form>
                </div>
            )}
            
            <button className={`chatbot-toggle-btn ${isOpen ? 'open' : ''}`} onClick={toggleChat}>
                {isOpen ? '×' : '💬'}
            </button>
        </div>
    );
};

export default Chatbot;