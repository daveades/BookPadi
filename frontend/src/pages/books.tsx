import React, { useState, useEffect } from 'react';
import axios from 'axios';
import RentalModal from '../components/RentalModal';
import '../assets/styles/pages/books.css';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface Book {
    id: string;
    title: string;
    author: string;
    cover_image: string;
    price: number;
    rating: number;
}

const BooksPage: React.FC = () => {
    const [books, setBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedBook, setSelectedBook] = useState<Book | null>(null);
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchBooks = async () => {
            try {
                const response = await axios.get('https://fluffy-doodle-7xjxggv9p772p7jr-5000.app.github.dev/api/books'); // Update URL to localhost
                console.log('Response:', response);
                console.log('Books data:', response.data);
                setBooks(response.data);
            } catch (err) {
                console.error('Error:', err);
                setError('Could not load books');
            } finally {
                setLoading(false);
            }
        };

        fetchBooks();
    }, []);

    // Add debug logging
    console.log('Current books state:', books);
    console.log('Loading state:', loading);
    console.log('Error state:', error);

    const handleRentClick = (book: Book) => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        setSelectedBook(book);
    };

    const handleRentConfirm = async (days: number) => {
        if (!selectedBook) return;
        
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                window.location.href = '/login';
                return;
            }

            const response = await axios.post(
                'https://fluffy-doodle-7xjxggv9p772p7jr-5000.app.github.dev/api/rentals',
                {
                    book_id: selectedBook.id,
                    duration_days: days
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (response.status === 201) {
                alert('Book rented successfully!');
            }
        } catch (err) {
            console.error('Error renting book:', err);
            alert('Failed to rent book. Please try again.');
        }
        setSelectedBook(null);
    };

    if (loading) return <div className="loading">Loading books...</div>;
    if (error) return <div className="error">{error}</div>;
    if (!books || books.length === 0) return <div>No books found</div>;

    return (
        <div className="books-container">
            <section className="books-grid">
                {Array.isArray(books) && books.map(book => (
                    <div 
                        className="book-card" 
                        onClick={() => navigate(`/books/${book.id}`)}
                    >
                        <div className="book-cover">
                            <img src={book.cover_image} alt={book.title} />
                        </div>
                        <div className="book-info">
                            <h3>{book.title}</h3>
                            <p className="author">{book.author}</p>
                            <div className="book-meta">
                                <span className="rating">⭐ {book.rating}</span>
                                <span className="price">Price: ${book.price}</span>
                            </div>
                            <button 
                                className="rent-btn"
                                onClick={() => handleRentClick(book)}
                            >
                                Rent Now
                            </button>
                        </div>
                    </div>
                ))}
            </section>

            {selectedBook && (
                <RentalModal
                    book={selectedBook}
                    onClose={() => setSelectedBook(null)}
                    onConfirm={handleRentConfirm}
                />
            )}
        </div>
    );
};

export default BooksPage;