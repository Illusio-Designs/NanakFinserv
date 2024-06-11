import React, { useState } from 'react';
import './Contact.css';
import Footer from '../components/Footer';

const Contact = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        services: []
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleCheckboxChange = (e) => {
        const { name, checked } = e.target;
        let updatedServices = [...formData.services];
        if (checked) {
            updatedServices.push(name);
        } else {
            updatedServices = updatedServices.filter(service => service !== name);
        }
        setFormData({
            ...formData,
            services: updatedServices
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Add logic to handle form submission, e.g., send data to backend
        console.log(formData);
    };

    return (
        <div className='contact'>
            <div className="banner">
                <h1>Contact Us</h1>
                {/* <div className="action-btn-banner">
                    <a href="/Contact" className="text-decoration-none">Home &gt;&gt; Contact</a>
                </div> */}
            </div>
            <div className="contact-info-section">
                <div className="box-contact">
                    <h3>Location</h3>
                    <p>121 King Street, Melbourne Victoria 3000 Australia</p>
                </div>
                <div className="box-contact">
                    <h3>Phone</h3>
                    <p>(+61 3 8376 6284), (+800 2345 6789)</p>
                </div >
                <div className="box-contact">
                    <h3>Email</h3>
                    <p>info@fiercevpn.com, fiercevpn@gmail.com</p>
                </div>
                
            </div>
            <div className="cta-container">
                <div className="cta-container-1">
                    <img src='/Assets/contact.png' />
                </div>
                <div className="cta-container-2">
                    <form onSubmit={handleSubmit} className="contact-form">
                        <h3>Name</h3>
                        <input type="text" name="name" placeholder="Your Name" value={formData.name} onChange={handleChange} required />
                        <h3>Email</h3>
                        <input type="email" name="email" placeholder="Your Email" value={formData.email} onChange={handleChange} required />
                        <h3>Mobile Number</h3>
                        <input type="tel" name="phone" placeholder="Your Phone Number" value={formData.phone} onChange={handleChange} required />
                        <div className="services-dropdown">
                            <h3>Services</h3>
                            <select multiple name="services" value={formData.services} onChange={handleChange} required>
                                <option value="Loan">Loan</option>
                                <option value="Mediclaim">Mediclaim</option>
                                <option value="Life Insurance">Life Insurance</option>
                                <option value="Vehicle Insurance">Vehicle Insurance</option>
                            </select>
                        </div>
                        <button type="submit">Submit</button>
                    </form>
                </div>
            </div>
            <Footer />
        </div>
    );
};

const ContactInfoBox = ({ imageSrc, title, info }) => (
    <div className="contact-col-box">
        <div className="contact-box">
            <figure><img src={imageSrc} alt="" className="img-fluid mission-icons" /></figure>
            <h5 className="mission-counter-contact">{title}:</h5>
            <p className="mb-0 contact-us-box-p">{info}</p>
        </div>
    </div>
);

const CheckboxInput = ({ name, label, onChange }) => (
    <label>
        <input type="checkbox" name={name} onChange={onChange} />
        {label}
    </label>
);

export default Contact;
