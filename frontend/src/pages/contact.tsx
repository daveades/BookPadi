import React, { useState } from 'react';
import '../assets/styles/pages/contact.css';

const ContactPage: React.FC = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: 'general',
        message: ''
    });
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('success'); // In real app, handle actual form submission
    };

    return (
        <div className="contact-container">
            <section className="contact-hero">
                <h1 className="fade-in">Get in Touch</h1>
                <p className="subtitle slide-up">We'd love to hear from you!</p>
            </section>

            <div className="contact-content">
                <div className="contact-info">
                    <h2>Contact Information</h2>
                    <div className="info-item">
                        <i className="fas fa-envelope"></i>
                        <p>support@bookpadi.com</p>
                    </div>
                    <div className="info-item">
                        <i className="fas fa-phone"></i>
                        <p>+234 123 456 7890</p>
                    </div>
                    <div className="info-item">
                        <i className="fas fa-location-dot"></i>
                        <p>Lagos, Nigeria</p>
                    </div>
                </div>

                <form className="contact-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="name">Name</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="subject">Subject</label>
                        <select
                            id="subject"
                            name="subject"
                            value={formData.subject}
                            onChange={handleChange}
                        >
                            <option value="general">General Inquiry</option>
                            <option value="support">Technical Support</option>
                            <option value="feedback">Feedback</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="message">Message</label>
                        <textarea
                            id="message"
                            name="message"
                            value={formData.message}
                            onChange={handleChange}
                            required
                            rows={5}
                        ></textarea>
                    </div>

                    <button type="submit" className="submit-btn">
                        Send Message
                    </button>

                    {status === 'success' && (
                        <div className="success-message">
                            Thank you for your message! We'll get back to you soon.
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

export default ContactPage;