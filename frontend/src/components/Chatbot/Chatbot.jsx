import React, { useState } from 'react';
import './Chatbot.css';

const Chatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { text: "Hi! I am the FoodZone bot. How can I help you today?", isBot: true }
    ]);
    const [input, setInput] = useState('');

    const toggleChat = () => setIsOpen(!isOpen);

    const handleSend = (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = { text: input, isBot: false };
        setMessages([...messages, userMsg]);
        setInput('');

        // Simple mock response logic based on keywords
        setTimeout(() => {
            let botReply = "I am a simple bot. Please contact support for more complex queries.";
            const lowerInput = userMsg.text.toLowerCase();
            
            if (lowerInput.includes('order')) {
                botReply = "You can track your orders in the 'My Orders' section from your profile.";
            } else if (lowerInput.includes('delivery')) {
                botReply = "Delivery usually takes 30-45 minutes depending on your location.";
            } else if (lowerInput.includes('hello') || lowerInput.includes('hi')) {
                botReply = "Hello! Looking for some delicious food?";
            } else if (lowerInput.includes('payment') || lowerInput.includes('pay')) {
                botReply = "We accept Cash on Delivery, UPI, Cards, and NetBanking.";
            }

            setMessages(prev => [...prev, { text: botReply, isBot: true }]);
        }, 1000);
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