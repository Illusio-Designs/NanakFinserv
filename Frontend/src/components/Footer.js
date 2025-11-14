import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';
import './SocialIcons.css';
import { addPublicInquiry } from '../serviceAPI/userAPI';
import { useToaster } from './Toaster';

const Footer = () => {
  const addToast = useToaster()
  // State to manage form inputs and error messages
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    service: ''
  });

  const [errors, setErrors] = useState({});

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    const newErrors = { ...errors }; // Copy existing errors
  
    // Update form data
    setFormData({ ...formData, [name]: value });
  
    // Dynamic validation for each field
    if (name === 'name') {
      if (!value.trim()) {
        newErrors.name = 'Name is required.';
      } else {
        delete newErrors.name; // Remove error if valid
      }
    }
  
    if (name === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!value.trim() || !emailRegex.test(value)) {
        newErrors.email = 'A valid email is required.';
      } else {
        delete newErrors.email; // Remove error if valid
      }
    }
  
    if (name === 'phone') {
      if (!value.trim() || value.length !== 10 || isNaN(value)) {
        newErrors.phone = 'Phone number must be exactly 10 digits.';
      } else {
        delete newErrors.phone; // Remove error if valid
      }
    }
  
    if (name === 'service') {
      if (!value) {
        newErrors.service = 'Please select a service.';
      } else {
        delete newErrors.service; // Remove error if valid
      }
    }
  
    // Update errors state
    setErrors(newErrors);
  };
  

  // Form validation
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

  // Handle form submission
  const handleSubmit = async(e) => {
    e.preventDefault();
    if (validate()) {
      console.log('Form submitted:', formData);
      // Replace this with your API call
      // alert('Form submitted successfully!');
      const userData = {
        username:formData.name.trim(),
        phone_number: formData.phone,
        email:formData.email,
        service: formData.service
      };
  
        const response = await addPublicInquiry(userData, addToast);
        if (response.status) {
          setFormData({ name: '', email: '', phone: '', service: '' }); // Reset form
        }
      
      
    }
  };

  return (
    <>
      <div className='cta'>
        <div className='container'>
          <div className='row'>
            <div className='col-12'>
              <form onSubmit={handleSubmit}>
                <div className="row align-items-center">
                  <div className="col-lg-6 col-md-6">
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="form-control"
                      placeholder="Name"
                    />
                    {errors.name && <small className="text-error">{errors.name}</small>}
                  </div>
                  <div className="col-lg-6 col-md-6">
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="form-control"
                      placeholder="Email"
                    />
                    {errors.email && <small className="text-error">{errors.email}</small>}
                  </div>
                  <div className="col-lg-6 col-md-6">
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="form-control"
                      placeholder="Phone Number"
                      maxLength="10"
                    />
                    {errors.phone && <small className="text-error">{errors.phone}</small>}
                  </div>
                  <div className="col-lg-6 col-md-6">
                    <select
                      name="service"
                      value={formData.service}
                      onChange={handleChange}
                      className="form-select"
                    >
                      <option value="" disabled>Services</option>
                      <option value="Loan Insurance">Loan Insurance</option>
                      <option value="Life Insurance">Life Insurance</option>
                      <option value="Vehicle Insurance">Vehicle Insurance</option>
                      <option value="Mediclaim Insurance">Mediclaim Insurance</option>
                    </select>
                    {errors.service && <small className="text-error">{errors.service}</small>}
                  </div>
                  <div className="col-12 text-center mt-4">
                    <button type="submit" className="btn btn-white">Submit</button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      <footer className='footer'>
        <div className='footer-top'>
          <div className='container'>
            <div className='row'>
              <div className='col-lg-6'>
                <div className='footer-widget'>
                  <Link to="/">
                    <img src="/Assets/logo.png" className="footer-logo img-fluid" alt="Logo" />
                  </Link>
                  <p>We understand that life is full of unexpected events, and protecting your loved ones and assets is a top priority.</p>
                  <div className='footer-info'>
                    <div className='phone'>
                      <a href="tel:+919925712341" style={{textDecoration: 'none', color: 'inherit'}}>
                        <div className='icons'>
                          <i className="fa-solid fa-phone-volume"></i>
                        </div>
                      </a>
                      <div className='content'>
                        <span>Have a question?</span>
                        <a href="tel:+919925712341" style={{textDecoration: 'none', color: 'inherit'}}>
                          <span>+91 99257 12341</span>
                        </a>
                      </div>
                    </div>
                    <div className='email'>
                      <a href="mailto:info@nanakfinserv.com" style={{textDecoration: 'none', color: 'inherit'}}>
                        <div className='icons'>
                          <i className="fa-regular fa-envelope"></i>
                        </div>
                      </a>
                      <div className='content'>
                        <span>Contact us at</span>
                        <a href="mailto:info@nanakfinserv.com" style={{textDecoration: 'none', color: 'inherit'}}>
                          <span>info@nanakfinserv.com</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className='col-lg-6'>
                <div className='footer-widget'>
                  <h3>Newsletter</h3>
                  <p>Be the first one to know about discounts, offers and events weekly in your mailbox. Unsubscribe whenever you like with one click.</p>
                  <div className='newsletter-form'>
                    <form className='d-flex align-items-center'>
                      <i className="fa-regular fa-envelope"></i>
                      <input type="email" className="form-control" id="exampleInputEmail1" placeholder='Enter your Email' />
                      <button type="submit" className="btn">Submit</button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className='footer-bottom'>
          <div className='container'>
            <div className='row align-items-center'>
              <div className='col-md-6'>
                <div className='copyright'>
                  <span>&copy; 2024. All Right Reserved. Design & Develop with ❤️️ by - <a href="https://illusiodesigns.agency/" target='_blank' rel='noopener noreferrer'>Illusio Designs</a></span>
                </div>
              </div>
              <div className='col-md-6'>
                <div className='social-media'>
                  <ul>
                    <li><a href="#"><i class="fa-brands fa-facebook-f"></i></a></li>
                    <li><a href="#"><i className="fa-brands fa-instagram"></i></a></li>
                    <li><a href="#"><i className="fa-brands fa-x-twitter"></i></a></li>
                    <li><a href="#"><i className="fa-brands fa-youtube"></i></a></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;
