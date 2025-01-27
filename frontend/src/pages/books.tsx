import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../assets/styles/pages/books.css';

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

    if (loading) return <div className="loading">Loading books...</div>;
    if (error) return <div className="error">{error}</div>;
    if (!books || books.length === 0) return <div>No books found</div>;

    return (
        <div className="books-container">
            <section className="books-grid">
                {Array.isArray(books) && books.map(book => ( // Add Array check
                    <div key={book.id} className="book-card">
                        <div className="book-cover">
                            <img src={book.cover_image} alt={book.title} />
                        </div>
                        <div className="book-info">
                            <h3>{book.title}</h3>
                            <p className="author">{book.author}</p>
                            <div className="book-meta">
                                <span className="rating">⭐ {book.rating}</span>
                                <span className="price">${book.price}</span>
                            </div>
                            <button className="rent-btn">Rent Now</button>
                        </div>
                    </div>
                ))}
            </section>
        </div>
    );
};

export default BooksPage;