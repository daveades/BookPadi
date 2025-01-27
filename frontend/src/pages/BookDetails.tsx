import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import RentalModal from '../components/RentalModal';
import '../assets/styles/pages/BookDetails.css';

interface Book {
    id: string;
    title: string;
    author: string;
    cover_image: string;
    price: number;
    rating: number;
    description: string;
}

const BookDetails: React.FC = () => {
    const { bookId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const [book, setBook] = useState<Book | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showRentalModal, setShowRentalModal] = useState(false);
    
    const isFromLibrary = location.state?.fromLibrary;

    useEffect(() => {
        const fetchBook = async () => {
            try {
                const response = await axios.get(
                    `https://fluffy-doodle-7xjxggv9p772p7jr-5000.app.github.dev/api/books/${bookId}`
                );
                setBook(response.data);
            } catch (err) {
                setError('Could not load book details');
            } finally {
                setLoading(false);
            }
        };
        
        fetchBook();
    }, [bookId]);

    const handleRentClick = () => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        setShowRentalModal(true);
    };

    const handleRentConfirm = async (days: number) => {
        if (!book) return;
        
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                'https://fluffy-doodle-7xjxggv9p772p7jr-5000.app.github.dev/api/rentals',
                {
                    book_id: book.id,
                    duration_days: days
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            
            if (response.status === 201) {
                navigate('/library');
            }
        } catch (err) {
            setError('Failed to rent book');
        }
        setShowRentalModal(false);
    };

    if (loading) return <div className="loading">Loading...</div>;
    if (error) return <div className="error">{error}</div>;
    if (!book) return <div className="error">Book not found</div>;

    return (
        <div className="book-details-container">
            <div className="book-details-content">
                <div className="book-cover">
                    <img src={book.cover_image} alt={book.title} />
                </div>
                <div className="book-info">
                    <h1>{book.title}</h1>
                    <h2>{book.author}</h2>
                    <div className="book-meta">
                        <span className="price">${book.price}</span>
                        <span className="rating">Rating: {book.rating}/5 ⭐</span>
                    </div>
                    <p className="description">{book.description}</p>
                    
                    {isFromLibrary ? (
                        <button className="read-button">Read Now</button>
                    ) : (
                        <button className="rent-button" onClick={handleRentClick}>
                            Rent Book
                        </button>
                    )}
                </div>
            </div>

            {showRentalModal && (
                <RentalModal
                    book={book}
                    onClose={() => setShowRentalModal(false)}
                    onConfirm={handleRentConfirm}
                />
            )}
        </div>
    );
};

export default BookDetails;