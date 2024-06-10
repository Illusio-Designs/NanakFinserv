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
        </div>
        <div className='footer-3'>
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


        

        


  
