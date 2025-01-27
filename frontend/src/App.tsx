import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Header, Footer } from './components';
import SignupPage from './pages/Signup';
import './assets/styles/pages/signup.css';

const App: React.FC = () => {
  return (
    <Router>
      <div className="app">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<div>Home Page</div>} />
            <Route path="/signup" element={<SignupPage />} />
            {/* Add more routes here */}
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
};

export default App;