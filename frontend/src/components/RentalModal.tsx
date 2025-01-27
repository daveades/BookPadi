// frontend/src/components/RentalModal.tsx
import React, { useState } from 'react';
import '../assets/styles/components/RentalModal.css';

interface RentalModalProps {
    book: {
        id: string;
        title: string;
        price: number;
    };
    onClose: () => void;
    onConfirm: (days: number) => void;
}

const RentalModal: React.FC<RentalModalProps> = ({ book, onClose, onConfirm }) => {
    const [days, setDays] = useState(3); // Minimum 3 days
    const calculatePrice = () => {
        return (book.price * days * 0.1).toFixed(2); // 10% of book price per day
    };

    return (
        <div className="rental-modal-overlay">
            <div className="rental-modal">
                <h2>Rent "{book.title}"</h2>
                <div className="rental-details">
                    <div className="form-group">
                        <label htmlFor="days">Rental Duration (days)</label>
                        <input
                            type="number"
                            id="days"
                            min="3"
                            max="15"
                            value={days}
                            onChange={(e) => setDays(parseInt(e.target.value))}
                        />
                    </div>
                    <div className="price-calculation">
                        <p>Total Price: ${calculatePrice()}</p>
                        <small>({days} days @ $${(book.price * 0.1).toFixed(2)}/day)</small>
                    </div>
                </div>
                <div className="modal-actions">
                    <button className="cancel-btn" onClick={onClose}>Cancel</button>
                    <button className="confirm-btn" onClick={() => onConfirm(days)}>
                        Confirm Rental
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RentalModal;