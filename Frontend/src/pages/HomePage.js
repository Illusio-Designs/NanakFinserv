import React, { useState, useEffect } from "react";
import Footer from "../components/Footer.js";
import { FlipWords } from "../components/flip-words";
import Slider from "../components/Slider.js";
import Popup from "../components/popup.js";
import '../styles/pages/HomePage.css';
import Review from '../components/Review.js';
import { Link } from 'react-router-dom';
import Clientslider from "../components/Clientslider.js";
import Navbar from '../components/Navbar';
import CTAPopup from '../components/CTAPopup.js';
import BlogSlider from '../components/BlogSlider.js';

const HomePage = () => {
  const [items, setItems] = useState([]);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isCTAPopupOpen, setIsCTAPopupOpen] = useState(false);

  // Open CTA popup once user scrolls 30% of the page (once per session)
  useEffect(() => {
    const hasShownCTAPopup = sessionStorage.getItem('hasShownCTAPopup');

    if (hasShownCTAPopup) {
      return;
    }

    const onScroll = () => {
      const doc = document.documentElement;
      const scrollTop = doc.scrollTop;
      const scrollHeight = doc.scrollHeight;
      const clientHeight = doc.clientHeight;
      const scrollable = Math.max(scrollHeight - clientHeight, 1);
      const scrolledRatio = scrollTop / scrollable;

      if (scrolledRatio >= 0.3) {
        setIsCTAPopupOpen(true);
        sessionStorage.setItem('hasShownCTAPopup', 'true');
        window.removeEventListener('scroll', onScroll);
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  const togglePopup = () => {
    setIsPopupOpen(!isPopupOpen);
  };

  const handlePhoneClick = () => {
    window.location.href = 'tel:+919925712341';
  };

  const closeCTAPopup = () => {
    setIsCTAPopupOpen(false);
  };

  return (
    <>
      <Navbar />
      
      {/* Hero Banner Section */}
      <section className="hero-banner">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6">
              <div className="hero-banner-content">
                <h1 className="heading">
                  Welcome to <span style={{color: '#196084'}}>Nanak Finserv</span> – Your Trusted Financial Consultancy in Rajkot, Gujarat
                </h1>
                <p>
                  At Nanak Finserv, we specialize in offering comprehensive financial solutions tailored to your needs. From securing the best home loans to protecting your future with insurance plans, we are your one-stop solution for financial guidance and consultancy.
                </p>
                <a href="/services" className="btn">
                  Explore Our Services
                </a>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="hero-banner-img">
                <img src="./Assets/hero-banner-img.jpg" alt="Hero Section" className="hero-banner-img img-fluid"/>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <div className="row">
            <div className="col-lg-4">
              <div className="features-box">
                <img src="./Assets/customers-world-wide.jpg" className="img-fluid" alt="Global Customers" />
                <div className="overlay"></div>
                <h5>We handle customers all over India</h5>
              </div>
            </div>
            <div className="col-lg-4">
              <div className="features-box">
                <img src="./Assets/customers-world-wide.jpg" className="img-fluid" alt="Instant Claims" />
                <div className="overlay"></div>
                <h5>Instant Claims Processing</h5>
              </div>
            </div>
            <div className="col-lg-4">
              <div className="features-box">
                <img src="./Assets/customers-world-wide.jpg" className="img-fluid" alt="Trusted Since 1995" />
                <div className="overlay"></div>
                <h5>Trusted since 1995 until present</h5>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="about">
        <div className="container">
          <div className="row">
            <div className="col-lg-8">
              <div className="about-content">
                <a href="/about" className="btn mb-4">
                  About Us
                </a>
                <h1 className="heading">
                  We provide the best solutions to guarantee the future for you or your family!
                </h1>
                <p>
                  At Nanak Finserv, our mission is to secure your future with insurance solutions that offer complete protection for you and your loved ones. From health and life insurance to coverage for your home and vehicle, our tailored plans ensure that you're prepared for whatever life brings.
                </p>
              </div>
            </div>
            <div className="col-lg-4">
              <div className="about-right-content">
                <p>
                  We understand that every individual and family has unique needs, which is why we take the time to customize policies that fit your lifestyle and budget. With our trusted support, you can face the future with confidence, knowing that you're covered by the best in the business.
                </p>
                <p>
                  Let us help you safeguard what matters most—your family, your home, and your peace of mind.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Service Section */}
      <section className="service">
        <div className="container">
          <div className="row">
            <div className="col-12">
              <div className="service-heading">
                <h1 className="heading text-center">
                  Why choose our services for your guarantee insurance?
                </h1>
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-lg-6">
              <div className="service-img">
                <img src="./Assets/are-you-covered.jpg" className="img-fluid" alt="Insurance Coverage"/>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="service-points">
                <div className="point">
                  <div className="point-icon">
                    <i className="bi bi-shield-check"></i>
                  </div>
                  <div className="point-content">
                    <h4>Comprehensive Coverage Options</h4>
                    <p>
                      We offer a wide range of insurance plans to meet your specific needs, including health, life, auto, home, and business coverage. Our flexible policies ensure that you get the protection you need without paying for what you don't.
                    </p>
                  </div>
                </div>
                <div className="point">
                  <div className="point-icon">
                    <i className="bi bi-headset"></i>
                  </div>
                  <div className="point-content">
                    <h4>24/7 Customer Support</h4>
                    <p>
                      We're here for you when you need us most. Our dedicated support team is available around the clock to assist with claims, policy changes, and any questions you may have.
                    </p>
                  </div>
                </div>
                <div className="point">
                  <div className="point-icon">
                    <i className="bi bi-currency-dollar"></i>
                  </div>
                  <div className="point-content">
                    <h4>Affordable and Transparent Pricing</h4>
                    <p>
                      Enjoy peace of mind knowing that you're getting high-quality coverage at competitive rates. We believe in transparent pricing with no hidden fees, so you know exactly what you're paying for.
                    </p>
                  </div>
                </div>
                <div className="point">
                  <div className="point-icon">
                    <i className="bi bi-lightning-charge"></i>
                  </div>
                  <div className="point-content">
                    <h4>Fast and Easy Claims Process</h4>
                    <p>
                      We make it simple to file and manage claims, ensuring a hassle-free experience when you need to use your insurance. Our goal is to get you back on track as quickly as possible.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Clients Section */}
      <section className="clients">
        <div className="container">
          <div className="row">
            <div className="col-lg-12">
              <h1 className="heading text-center mb-4">Trusted Companies We are Working With</h1>
              <Clientslider />
            </div>
          </div>
        </div>
      </section>

      {/* Contact Info Section */}
      <section className="contact-info">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6">
              <div className="contact-info-content">
                <h1 className="heading">
                  Free your youth for a brighter and more purposeful future
                </h1>
                <p>
                  At Nanak Finserv, we believe in providing young people with the freedom and security to pursue their passions, knowing that their future is protected. Our comprehensive insurance plans are designed to safeguard their health, education, and financial well-being, allowing them to focus on what truly matters—building a fulfilling and impactful life.
                </p>
                <div className="img">
                  <img src="./Assets/happy-family.jpg" className="img-fluid" alt="Happy Family"/>
                  <div className="experience">
                    <h4>25 Years of</h4>
                    <p>Experience</p>
                  </div> 
                </div>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="contact-info-details">
                <img src="./Assets/couple-taking-insurance.jpg" className="img-fluid" alt="Insurance Consultation"/>
                <div className="row">
                  <div className="col-6">
                    <div className="certifed-team">
                      <div className="certifed-team-content">
                        <h4>Certified Team</h4>
                        <p>
                          Trust our expertise to protect what matters most to you, and experience the peace of mind that comes with working with true insurance professionals.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="trusted-company">
                      <div className="trusted-company-content">
                        <h4>Trusted Company</h4>
                        <p>
                          We prioritize transparency in all our dealings, offering clear policies and straightforward advice so you always know what to expect.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="row">
                  <div className="col-12">
                    <div className="phone-number" onClick={handlePhoneClick}>
                      <div className="phone-icon">
                        <i className="bi bi-telephone"></i>
                      </div>
                      <div className="phone-number-info">
                        <h1 className="heading" onClick={handlePhoneClick}>+91 99257 12341</h1>
                        <p>Call Agent</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Blog Section */}
      <BlogSlider title="Recent Insights & Updates" />

      <Footer /> 
      <CTAPopup isOpen={isCTAPopupOpen} onClose={closeCTAPopup} />
    </>    
  );
};

export default HomePage;
