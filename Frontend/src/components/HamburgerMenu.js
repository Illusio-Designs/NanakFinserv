import React, { useState } from 'react';
import './HamburgerMenu.css'; // Import the CSS file

const HamburgerMenu = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav role="navigation">
      <div id="menuToggle">
        <input type="checkbox" checked={isOpen} onChange={toggleMenu} />

        <span className={isOpen ? 'open' : ''}></span>
        <span className={isOpen ? 'open' : ''}></span>
        <span className={isOpen ? 'open' : ''}></span>

        <ul id="menu" className={isOpen ? 'show' : ''}>
          <a href="#"><li>Home</li></a>
          <a href="#"><li>About</li></a>
          <a href="#"><li>Info</li></a>
          <a href="#"><li>Contact</li></a>
          <a href="https://erikterwan.com/" target="_blank" rel="noopener noreferrer"><li>Show me more</li></a>
        </ul>
      </div>
    </nav>
  );
};

export default HamburgerMenu;
