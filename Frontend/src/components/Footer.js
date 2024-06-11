import React from 'react';
import './Footer.css';
import './SocialIcons.css';

const Footer = () => {
  return (
    <footer className='footer'>
      <div className='footer-u'>
        <div className="dk-footer-box-info">
          <a href="index.html" className="footer-logo">
            <img src="/Assets/logo.png" alt="footer_logo" className="img-fluid" />
          </a>
          <p className="footer-info-text">
            Reference site about Lorem Ipsum,<br /> 
            giving information on its origins,<br />
            as well as a random Lipsum generator.
          </p>
          <ul className='footer-social-link'>
            <li><a href="#"><i className="fa fa-facebook"></i></a></li>
            <li><a href="#"><i className="fa fa-twitter"></i></a></li>
            <li><a href="#"><i className="fa fa-instagram"></i></a></li>
          </ul>
        </div>
        <div className='footer-2'>
          <h1>Useful Links</h1><br />
          <a href='#'>Blog</a><br />
          <a href='#'>Contact</a><br />
          <a href='#'>Contact</a><br />
          <a href='#'>Home</a><br />
          <a href='#'>About</a><br />
          <a href='#'>Terms & Conditions</a><br />
        </div>
        <div className='footer-3'>
          <h1>Subscribe us</h1><br />
          <p>Which bears and sustains us, as <br /> it floats around us in an eternity of bliss.</p><br />
          <form action="#">
              <div className="col dk-footer-form">
                <input type="email" className="form-control" placeholder="Email Address" />
                <button type="submit">
                  <i className="fa fa-send"></i>
                </button>
              </div>
          </form>
        </div>
      </div>
      <div className="col-md-6">
        <span>Copyright © 2024, All Right Reserved Nanak Finserv</span>
      </div>
    </footer>
  );
};

export default Footer;


{/*
         */}


        

        


  
