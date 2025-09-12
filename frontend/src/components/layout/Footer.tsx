import React, { useEffect, useState } from 'react';
import '../../assets/styles/components/Footer.css';

const Footer: React.FC = () => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;
      // Show footer only if at the bottom
      if (scrollY + windowHeight >= docHeight - 2) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <footer style={{ opacity: visible ? 1 : 0, pointerEvents: visible ? 'auto' : 'none' }}>
      <p>&copy; 2024 BookPadi. All rights reserved.</p>
    </footer>
  );
};

export default Footer;