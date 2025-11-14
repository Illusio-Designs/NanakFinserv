import React, { useState, useEffect } from 'react';
import './Navbar.css';
import { Link, useLocation } from 'react-router-dom';
import HamburgerMenu from './HamburgerMenu.js';

const Navbar = () => {
  const [isToggled, setIsToggled] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const handleToggle = () => {
    setIsToggled(!isToggled);
  };

  // Handle sticky navbar on scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsSticky(scrollTop > 100); // Make navbar sticky after 100px scroll
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when location changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  // Check if current path matches nav link
  const isActive = (path) => {
    if (path === '/blog') {
      // Make blog active for both /blog and /blog/:id paths
      return location.pathname === '/blog' || location.pathname.startsWith('/blog/');
    }
    return location.pathname === path;
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
    <nav className={`navbar navbar-expand-lg navbar-light ${isSticky ? 'navbar-sticky' : ''}`}>
      <div className="container">
        <Link className="navbar-brand" to="/">
          <img src="/Assets/logo.png" className="logo img-fluid" alt="Logo" />
        </Link>
        <div className="navbar-desktop-menu">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <Link 
                className={`nav-link ${isActive('/services') ? 'nav-link-active' : ''}`} 
                to="/services"
              >
                Services
              </Link>
            </li>
            <li className="nav-item">
              <Link 
                className={`nav-link ${isActive('/about') ? 'nav-link-active' : ''}`} 
                to="/about"
              >
                About
              </Link>
            </li>
            <li className="nav-item">
              <Link 
                className={`nav-link ${isActive('/contact') ? 'nav-link-active' : ''}`} 
                to="/contact"
              >
                Contact
              </Link>
            </li>
            <li className="nav-item">
              <Link 
                className={`nav-link ${isActive('/blog') ? 'nav-link-active' : ''}`} 
                to="/blog"
              >
                Blog
              </Link>
            </li>
          </ul>
          <div>
            <Link className="btn login-btn" to="/login">Login</Link>
          </div>          
        </div>
        <HamburgerMenu 
          isOpen={isMobileMenuOpen} 
          toggleMenu={toggleMobileMenu}
          isActive={isActive}
        />
      </div>
    </nav>
    </>
  );
}

export default Navbar;