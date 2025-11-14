import React, { useState } from 'react';
import '../styles/pages/Contact.css';
import Footer from '../components/Footer';
import { addInquieryUser } from '../serviceAPI/userAPI.js';
import Navbar from '../components/Navbar';

const Contact = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        service: ''
    });
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        const { name, value } = e.target;
        const newErrors = { ...errors };

        setFormData({ ...formData, [name]: value });

        if (name === 'name') {
            if (!value.trim()) {
                newErrors.name = 'Name is required.';
            } else {
                delete newErrors.name;
            }
        }

        if (name === 'email') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!value.trim() || !emailRegex.test(value)) {
                newErrors.email = 'A valid email is required.';
            } else {
                delete newErrors.email;
            }
        }

        if (name === 'phone') {
            if (!value.trim() || value.length !== 10 || isNaN(value)) {
                newErrors.phone = 'Phone number must be exactly 10 digits.';
            } else {
                delete newErrors.phone;
            }
        }

        if (name === 'service') {
            if (!value) {
                newErrors.service = 'Please select a service.';
            } else {
                delete newErrors.service;
            }
        }

        setErrors(newErrors);
    };

    const validate = () => {
        const newErrors = {};
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!formData.name.trim()) newErrors.name = 'Name is required.';
        if (!formData.email.trim() || !emailRegex.test(formData.email)) newErrors.email = 'A valid email is required.';
        if (!formData.phone.trim() || formData.phone.length !== 10 || isNaN(formData.phone))
            newErrors.phone = 'Phone number must be exactly 10 digits.';
        if (!formData.service) newErrors.service = 'Please select a service.';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (validate()) {
            const userData = {
                username: formData.name.trim(),
                phone_number: formData.phone,
                email: formData.email,
                service: formData.service
            };

            const response = await addInquieryUser(userData);
            if (response.status) {
                setFormData({ name: '', email: '', phone: '', service: '' });
            }
        }
    };

    return (
        <>
            <Navbar />

            {/* Contact Form Section */}
            <section className="contact-form-section">
                <div className="container">
                    <div className="row">
                        <div className="col-lg-8">
                            <div className="contact-form-wrapper">
                                <div className="contact-form-header">
                                    <h2 className="contact-form-heading">Send us a Message</h2>
                                    <p className="contact-form-subtitle">Fill out the form below and we'll get back to you within 24 hours.</p>
                                </div>
                                <form onSubmit={handleSubmit} className="contact-form">
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label htmlFor="name">Full Name</label>
                                            <input
                                                type="text"
                                                id="name"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                                placeholder="Enter your full name"
                                                className={errors.name ? 'error' : ''}
                                            />
                                            {errors.name && <span className="error-message">{errors.name}</span>}
                                    </div>
                                        <div className="form-group">
                                            <label htmlFor="email">Email Address</label>
                                            <input
                                                type="email"
                                                id="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                                placeholder="Enter your email"
                                                className={errors.email ? 'error' : ''}
                                            />
                                            {errors.email && <span className="error-message">{errors.email}</span>}
                                        </div>
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label htmlFor="phone">Phone Number</label>
                                            <input
                                                type="tel"
                                                id="phone"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                                placeholder="Enter your phone number"
                                                maxLength="10"
                                                className={errors.phone ? 'error' : ''}
                                            />
                                            {errors.phone && <span className="error-message">{errors.phone}</span>}
                                    </div>
                                        <div className="form-group">
                                            <label htmlFor="service">Service Interest</label>
                                            <select
                                                id="service"
                                                name="service"
                                            value={formData.service}
                                            onChange={handleChange}
                                                className={errors.service ? 'error' : ''}
                                            >
                                                <option value="">Select a service</option>
                                            <option value="Loan Insurance">Loan Insurance</option>
                                            <option value="Life Insurance">Life Insurance</option>
                                            <option value="Vehicle Insurance">Vehicle Insurance</option>
                                            <option value="Mediclaim Insurance">Mediclaim Insurance</option>
                                        </select>
                                            {errors.service && <span className="error-message">{errors.service}</span>}
                                        </div>
                                    </div>
                                    <button type="submit" className="contact-submit-btn">
                                        <span>Send Message</span>
                                        <i className="fas fa-paper-plane"></i>
                                    </button>
                                </form>
                            </div>
                        </div>
                        <div className="col-lg-4">
                            <div className="contact-info-wrapper">
                                <div className="contact-info-header">
                                    <h3 className="contact-info-heading">Contact Information</h3>
                                    <p className="contact-info-subtitle">Get in touch with us through any of these channels.</p>
                                </div>
                                <div className="contact-info-items">
                                    <div className="contact-info-item">
                                        <a href="tel:+919925712341" className="contact-info-link">
                                            <div className="contact-info-icon">
                                                <i className="fas fa-phone"></i>
                                            </div>
                                            <div className="contact-info-content">
                                                <h4>Phone Number</h4>
                                                <p>+91 99257 12341</p>
                                            </div>
                                        </a>
                                    </div>
                                    <div className="contact-info-item">
                                        <a href="mailto:info@nanakfinserv.com" className="contact-info-link">
                                            <div className="contact-info-icon">
                                                <i className="fas fa-envelope"></i>
                                            </div>
                                            <div className="contact-info-content">
                                                <h4>Email Address</h4>
                                                <p>info@nanakfinserv.com</p>
                                            </div>
                                        </a>
                                    </div>
                                    <div className="contact-info-item">
                                        <a href="https://maps.app.goo.gl/a3kaxaHuav5PX5cq7" target="_blank" rel="noopener noreferrer" className="contact-info-link">
                                            <div className="contact-info-icon">
                                                <i className="fas fa-map-marker-alt"></i>
                                            </div>
                                            <div className="contact-info-content">
                                                <h4>Office Location</h4>
                                                <p>NANAK FINSERV RK PRIME OFFICE NO. 1013, NEAR SILVER HEIGHTS, NANA MAVA CIRCLE, RAJKOT - 360005</p>
                                            </div>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Map Section */}
            <section className="contact-map-section">
                <div className="container">
                    <div className="row">
                        <div className="col-12">
                            <div className="map-wrapper">
                                <h3 className="map-heading">Find Us on the Map</h3>
                                <div className="map-container">
                                    <iframe
                                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3692.0663911510765!2d70.77616222506859!3d22.27547477970441!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3959cb03c54e88b9%3A0xf12ceb142d0194b7!2sNANAK%20FINSERV!5e0!3m2!1sen!2sin!4v1754485938481!5m2!1sen!2sin"
                                        width="100%"
                                        height="450"
                                        allowFullScreen=""
                                        loading="lazy"
                                        referrerPolicy="no-referrer-when-downgrade"
                                        title="Office Location"
                                    ></iframe>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </>
    );
};

export default Contact;
