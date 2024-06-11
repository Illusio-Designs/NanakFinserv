import React, { useState } from 'react';
import './Navbar.css';
import { Link } from 'react-router-dom';

const Navbar = () => {
  const [isToggled, setIsToggled] = useState(false);

  const handleToggle = () => {
    setIsToggled(!isToggled);
  };

  return (
    <nav className="navbar">
      <div className="container-fluid">
        <Link className="navbar-brand" to='/'>
          <img src="/Assets/logo.png" className="logo" alt="Logo" />
        </Link>
        <div className="navbar-nav">
          <ul>
            <li className="nav-item">
              <Link className="nav-link" to="/services">Services</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/about">About</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/contact">Contact</Link>
            </li>
          </ul>
        </div>
        <div>
          <Link className="btn login-btn" to="/login">Login</Link>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;