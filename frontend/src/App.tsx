import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Header, Footer } from './components';
import SignupPage from './pages/Signup';
import LoginPage from './pages/Login';
import HomePage from './pages/home';
import ContactPage from './pages/contact';
import AboutPage from './pages/About';
import BooksPage from './pages/books';
import './assets/styles/pages/login.css';
import './assets/styles/pages/signup.css';
import { AuthProvider } from './context/AuthContext';


const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Header />
          <main>
            <Routes>
              <Route path="/" element={<HomePage/>} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/books" element={<BooksPage />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;