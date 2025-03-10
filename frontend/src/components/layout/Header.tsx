import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../../assets/images/logo.png';
import '../../assets/styles/components/Header.css';
import { useAuth } from '../../context/AuthContext';

const Header: React.FC = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <header className="header">
            <div className="header-container">
                <Link to="/" className="logo">
                    <img src={logo} alt="BookPadi Logo" className='logo-image' />
                    <span className="logo-text">BookPadi</span>
                </Link>

                <button
                    className="mobile-menu-button"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </button>

                <nav className={`nav-menu ${isMenuOpen ? 'active' : ''}`}>
                    <ul>
                        <li><Link to="/">Home</Link></li>
                        <li><Link to="/books">Books</Link></li>
                        <li><Link to="/categories">Categories</Link></li>
                        <li><Link to="/about">About</Link></li>
                        <li><Link to="/contact">Contact</Link></li>
                    </ul>
                </nav>

                <div className="auth-buttons">
                    {isAuthenticated ? (
                        <>
                            <Link to="/library" className="library-btn">My Library</Link>
                            <button onClick={handleLogout} className="logout-btn">Logout</button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="login-btn">Login</Link>
                            <Link to="/signup" className="signup-btn">Sign Up</Link>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;