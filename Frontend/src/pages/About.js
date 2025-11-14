import React from 'react';
import '../styles/pages/About.css';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer.js';
import Navbar from '../components/Navbar.js';
import Clientslider from '../components/Clientslider.js';
import BlogSlider from '../components/BlogSlider.js';

const About = () => {
    return (
        <>
            <Navbar />
            
            {/* Hero Section */}
            <section className="about-hero-section">
                <div className="container">
                    <div className="row align-items-center">
                        <div className="col-lg-6">
                            <div className="about-hero-content">
                                <a href="/about" className="btn mb-4">About us</a>
                                <h1 className="about-main-heading">We provide the best solutions to guarantee the future for you and your family!</h1>
                                <p className="about-hero-description">
                                    At Nanak Finserv, your future and your family's well-being are at the heart of everything we do. With a deep commitment to excellence and trust, we offer comprehensive insurance solutions that secure your life, health, and assets against life's uncertainties.
                                </p>
                            </div>
                        </div>
                        <div className="col-lg-6">
                            <div className="about-hero-image-wrapper">
                                <img src="./Assets/happy-family.jpg" className="about-hero-image" alt="Happy family"/>
                                <div className="about-experience-badge">
                                    <h4>25 Years of</h4>
                                    <p>Experience</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Mission Section */}
            <section className="about-mission-section">
                <div className="container">
                    <div className="row">
                        <div className="col-lg-8">
                            <div className="about-mission-content">
                                <a href="/about" className="btn mb-4">About us</a>
                                <h2 className="about-section-heading">We provide the best solutions to guarantee the future for you and your family!</h2>
                                <p className="about-mission-description">
                                    At Nanak Finserv, your future and your family's well-being are at the heart of everything we do. With a deep commitment to excellence and trust, we offer comprehensive insurance solutions that secure your life, health, and assets against life's uncertainties.
                                </p>
                            </div>
                        </div>
                        <div className="col-lg-4">
                            <div className="about-features-list">
                                <h3 className="about-features-heading">Why Choose Our Solutions?</h3>
                                <ul className="about-features-ul">
                                    <li className="about-feature-item">
                                        <strong>Comprehensive Coverage:</strong> From safeguarding your health to protecting your financial goals, we've got you covered every step of the way.
                                    </li>
                                    <li className="about-feature-item">
                                        <strong>Affordable Options:</strong> Flexible premiums to fit your budget without compromising on quality or coverage.
                                    </li>
                                    <li className="about-feature-item">
                                        <strong>Peace of Mind:</strong> With us, you can focus on what matters most—living your life—while we handle your future's security.
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Statistics Section */}
            <section className="about-stats-section">
                <div className="container">
                    <div className="row">
                        <div className="col-lg-3 col-md-6">
                            <div className="about-stat-card">
                                <i className="fa-solid fa-coins about-stat-icon"></i>
                                <h3 className="about-stat-number">1.2 Million</h3>
                                <p className="about-stat-label">Loan Insurance customers</p>
                            </div>
                        </div>
                        <div className="col-lg-3 col-md-6">
                            <div className="about-stat-card">
                                <i className="fa-solid fa-car-burst about-stat-icon"></i>
                                <h3 className="about-stat-number">1.2 Million</h3>
                                <p className="about-stat-label">Vehicle Insurance customers</p>
                            </div>
                        </div>
                        <div className="col-lg-3 col-md-6">
                            <div className="about-stat-card">
                                <i className="fa-solid fa-heart-pulse about-stat-icon"></i>
                                <h3 className="about-stat-number">1.2 Million</h3>
                                <p className="about-stat-label">Life Insurance customers</p>
                            </div>
                        </div>
                        <div className="col-lg-3 col-md-6">
                            <div className="about-stat-card">
                                <i className="fa-solid fa-tablets about-stat-icon"></i>
                                <h3 className="about-stat-number">1.2 Million</h3>
                                <p className="about-stat-label">Mediclaim Insurance customers</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Blog Section */}
            <BlogSlider title="Recent Blogs" />

            {/* Clients Section */}
            <section className="clients">
                <div className="container">
                    <div className="row">
                        <div className="col-lg-12">
                            <h2 className="about-section-heading text-center">Trusted Companies We are Working With</h2>
                            <Clientslider />
                        </div>
                    </div>
                </div>
            </section>       
            <Footer />
        </>
    );
};

export default About;
