import React from 'react';
import '../assets/styles/pages/about.css';

const AboutPage: React.FC = () => {
    return (
        <div className="about-container">
            <section className="about-hero">
                <h1 className="fade-in">About BookPadi</h1>
                <p className="subtitle slide-up">Your Trusted Digital Library Partner</p>
            </section>

            <section className="story-section">
                <div className="content-wrapper">
                    <h2>Our Story</h2>
                    <p>
                        Founded in 2024, BookPadi emerged from a simple yet powerful idea:
                        making books accessible to everyone in Nigeria. We believe that
                        knowledge should know no boundaries, and reading should be affordable
                        and convenient.
                    </p>
                </div>
            </section>

            <section className="mission-section">
                <div className="content-wrapper">
                    <h2>Our Mission</h2>
                    <div className="mission-grid">
                        <div className="mission-card">
                            <div className="icon">📚</div>
                            <h3>Accessibility</h3>
                            <p>Making quality books available to everyone</p>
                        </div>
                        <div className="mission-card">
                            <div className="icon">💡</div>
                            <h3>Innovation</h3>
                            <p>Leveraging technology to enhance reading experience</p>
                        </div>
                        <div className="mission-card">
                            <div className="icon">🤝</div>
                            <h3>Community</h3>
                            <p>Building a community of book lovers</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="values-section">
                <div className="content-wrapper">
                    <h2>Our Values</h2>
                    <div className="values-list">
                        <div className="value-item">
                            <div className="icon">🎯</div>
                            <h3>Accessibility</h3>
                            <p>Making reading affordable and convenient for everyone</p>
                        </div>
                        <div className="value-item">
                            <div className="icon">⭐</div>
                            <h3>Quality</h3>
                            <p>Providing the best reading experience possible</p>
                        </div>
                        <div className="value-item">
                            <div className="icon">🚀</div>
                            <h3>Innovation</h3>
                            <p>Continuously improving our platform</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="team-section">
                <div className="content-wrapper">
                    <h2>Our Team</h2>
                    <div className="team-grid">
                        <div className="team-member">
                            <div className="member-image"></div>
                            <h3>John Doe</h3>
                            <p>Founder & CEO</p>
                        </div>
                        <div className="team-member">
                            <div className="member-image"></div>
                            <h3>Jane Smith</h3>
                            <p>Head of Operations</p>
                        </div>
                        <div className="team-member">
                            <div className="member-image"></div>
                            <h3>Mike Johnson</h3>
                            <p>Tech Lead</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default AboutPage;