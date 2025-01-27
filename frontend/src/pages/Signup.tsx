import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const SignupPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await axios.post('https://bookpadi.onrender.com/api/signup', {
                email,
                password
            });
            
            if (response.status === 201) {
                navigate('/login');
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Something went wrong');
        }
    };

    return (
        <div className="signup-container">
            <form onSubmit={handleSubmit} className="signup-form">
                <h2>Create Account</h2>
                {error && <div className="error-message">{error}</div>}
                
                <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>

                <button type="submit" className="signup-submit-btn">
                    Sign Up
                </button>

                <div className="login-link">
                    Already have an account? <Link to="/login">Login</Link>
                </div>
            </form>
        </div>
    );
};

export default SignupPage;