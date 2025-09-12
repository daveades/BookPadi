import React from 'react';
import '../assets/styles/components/LoadingScreen.css';

const LoadingScreen: React.FC = () => (
  <div className="loading-screen">
    <div className="spinner"></div>
    <p>Loading books...</p>
  </div>
);

export default LoadingScreen;
