import React from 'react';
import { Link } from 'react-router-dom';
import '../assets/styles/pages/home.css';

const HomePage: React.FC = () => {
    return (
        <div className="home-container">
            <section className="hero-section">
                <div className="hero-content">
                    <h1 className="fade-in">
                        Welcome to <span className="highlight">BookPadi</span>
                    </h1>
                    <p className="subtitle slide-up">
                        Your digital library for renting and reading amazing books
                    </p>
                    <div className="cta-buttons slide-up">
                        <Link to="/books" className="cta-primary">
                            Browse Books
                        </Link>
                        <Link to="/signup" className="cta-secondary">
                            Get Started
                        </Link>
                    </div>
                </div>
            </section>

            <section className="features-section">
                <h2 className="section-title">Why Choose BookPadi?</h2>
                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon">📚</div>
                        <h3>Extensive Library</h3>
                        <p>Access thousands of books across various genres</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">💰</div>
                        <h3>Affordable</h3>
                        <p>Rent books at fraction of their purchase price</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">📱</div>
                        <h3>Read Anywhere</h3>
                        <p>Access your books on any device, anytime</p>
                    </div>
                </div>
            </section>

            <section className="how-it-works">
                <h2 className="section-title">How It Works</h2>
                <div className="steps-container">
                    <div className="step">
                        <div className="step-number">1</div>
                        <h3>Sign Up</h3>
                        <p>Create your free account</p>
                    </div>
                    <div className="step">
                        <div className="step-number">2</div>
                        <h3>Choose Books</h3>
                        <p>Browse and select your books</p>
                    </div>
                    <div className="step">
                        <div className="step-number">3</div>
                        <h3>Start Reading</h3>
                        <p>Enjoy your books instantly</p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default HomePage;