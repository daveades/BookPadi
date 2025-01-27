import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../assets/styles/pages/library.css';

interface Book {
    id: string;
    title: string;
    author: string;
    cover_image: string;
}

interface Rental {
    id: string;
    book: Book;
    rental_date: string;
    return_date: string;
    remaining_days: number;
    rental_price: number;
}

const LibraryPage: React.FC = () => {
    const [rentals, setRentals] = useState<Rental[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        const fetchRentals = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(
                    'https://fluffy-doodle-7xjxggv9p772p7jr-5000.app.github.dev/api/user/rentals',
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );
                setRentals(response.data);
            } catch (err) {
                setError('Could not load your rentals');
            } finally {
                setLoading(false);
            }
        };

        fetchRentals();
    }, [isAuthenticated, navigate]);

    if (loading) return <div className="loading">Loading your library...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="library-container">
            <h1>My Library</h1>
            <div className="rentals-grid">
                {rentals.map(rental => (
                    <div 
                        key={rental.id} 
                        className="rental-card" 
                        onClick={() => navigate(`/books/${rental.book.id}`, { state: { fromLibrary: true } })}
                    >
                        <div className="book-cover">
                            <img src={rental.book.cover_image} alt={rental.book.title} />
                        </div>
                        <div className="rental-info">
                            <h3>{rental.book.title}</h3>
                            <p className="author">{rental.book.author}</p>
                            <div className="rental-meta">
                                <p className="remaining-days">
                                    {rental.remaining_days > 0 
                                        ? `${rental.remaining_days} days remaining`
                                        : 'Rental expired'}
                                </p>
                                <p className="rental-dates">
                                    <span>Rented: {new Date(rental.rental_date).toLocaleDateString()}</span>
                                    <span>Returns: {new Date(rental.return_date).toLocaleDateString()}</span>
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            {rentals.length === 0 && (
                <div className="no-rentals">
                    <p>You haven't rented any books yet.</p>
                    <button onClick={() => navigate('/books')} className="browse-btn">
                        Browse Books
                    </button>
                </div>
            )}
        </div>
    );
};

export default LibraryPage;