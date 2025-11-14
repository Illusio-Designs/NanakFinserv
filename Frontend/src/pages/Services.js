import React from 'react';
import '../styles/pages/Services.css';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer.js';
import Navbar from '../components/Navbar.js';
import Clientslider from '../components/Clientslider.js';
import BlogSlider from '../components/BlogSlider.js';

const Services = () => {
    return (
      <>
        <Navbar />
        
        {/* Hero Section */}
        <section className='services-hero-section'>
          <div className='container'>
            <div className='row align-items-center'>
              <div className='col-lg-6'>
                <div className='services-hero-content'>
                  <h1 className='services-main-heading'>Insurance services that have accompanied since 1995</h1>
                  <p className='services-hero-description'>For nearly three decades, we have been a reliable partner in protecting what matters most to individuals, families, and businesses. Established in 1995, our legacy is built on trust, commitment, and delivering exceptional insurance solutions tailored to your unique needs.</p>
                  <h3 className='services-sub-heading'>Our Journey of Excellence</h3>
                  <p className='services-hero-description'>Since our inception, we have been dedicated to providing comprehensive insurance services that evolve with your needs and the changing times. Over the years, we have expanded our offerings, refined our processes, and embraced innovation to ensure we deliver unparalleled value to our customers.</p>
                </div>
              </div>
              <div className='col-lg-6'>
                <div className='services-hero-image-wrapper'>
                  <img src="./Assets/happy-family.jpg" className="services-hero-image" alt="Happy family"/>
                  <div className="services-experience-badge">
                    <h4>25 Years of</h4>
                    <p>Experience</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Clients Section - Keep original class name */}
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

        {/* Services Focus Section */}
        <section className='services-focus-section'>
          <div className='container'>
            <div className='row'>
              <div className='col-lg-12'>
                <div className='services-focus-header'>
                  <h2 className='services-focus-heading'>The focus of our insurance services</h2>
                </div>
              </div>
            </div>
            <div className='row'>
              <div className='col-lg-3 col-md-6 my-3'>
                <div className='services-focus-card'>
                  <h3>Life Insurance</h3>
                  <p>Life insurance provides financial security to your loved ones in the event of your passing. It ensures they are supported during challenging times, covering expenses such as daily living costs, education, debts, and more.</p>
                </div>
              </div>
              <div className='col-lg-3 col-md-6 my-3'>
                <div className='services-focus-card'>
                  <h3>Loan</h3>
                  <p>Loan insurance provides coverage to ensure that your outstanding loans are repaid in case of unforeseen events such as death, disability, or job loss. It protects you and your loved ones from the financial burden of unpaid debts.</p>
                </div>
              </div>
              <div className='col-lg-3 col-md-6 my-3'>
                <div className='services-focus-card'>
                  <h3>Vehicle Insurance</h3>
                  <p>Vehicle insurance provides financial protection for your car, bike, or any motor vehicle in case of accidents, theft, natural disasters, or third-party liabilities. It's not just a legal requirement but also a smart way to safeguard your investment.</p>
                </div>
              </div>
              <div className='col-lg-3 col-md-6 my-3'>
                <div className='services-focus-card'>
                  <h3>Mediclaim</h3>
                  <p>Mediclaim insurance provides financial coverage for hospitalization, medical treatments, and related expenses. It ensures you can focus on recovery without worrying about the financial burden of medical bills.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Blog Section */}
        <BlogSlider title="Recent Blogs" />
        
        <Footer />
      </>
    )    
};

export default Services;
