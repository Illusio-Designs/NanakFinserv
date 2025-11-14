import React from 'react';
import './HamburgerMenu.css'; 
import { Link } from 'react-router-dom';

const HamburgerMenu = ({ isOpen, toggleMenu, isActive }) => {
  return (
    <nav role="navigation" className='mobileMenu'>
      <div id="menuToggle">
        <input type="checkbox" checked={isOpen} onChange={toggleMenu} id="menu-toggle" />
        <label htmlFor="menu-toggle" className="hamburger-button">
          <span></span>
          <span></span>
          <span></span>
        </label>
        
        <div id="menu" className={isOpen ? 'show' : ''}>
          <button className="menu-close" onClick={toggleMenu} aria-label="Close menu">
            <i className="fas fa-times"></i>
          </button>
          <ul>
            <li className={isActive('/') ? 'active' : ''}>
              <Link to="/" onClick={toggleMenu}>Home</Link>
            </li>
            <li className={isActive('/services') ? 'active' : ''}>
              <Link to="/services" onClick={toggleMenu}>Services</Link>
            </li>
            <li className={isActive('/about') ? 'active' : ''}>
              <Link to="/about" onClick={toggleMenu}>About</Link>
            </li>
            <li className={isActive('/contact') ? 'active' : ''}>
              <Link to="/contact" onClick={toggleMenu}>Contact</Link>
            </li>
            <li className={isActive('/blog') ? 'active' : ''}>
              <Link to="/blog" onClick={toggleMenu}>Blog</Link>
            </li>
            <li>
              <button className="mobile-login-btn" type="button" onClick={() => {
                toggleMenu();
                window.location.href = '/login';
              }}>Login</button>
            </li>
          </ul>
        </div>
      </div>      
    </nav>    
  );
};

export default HamburgerMenu;
