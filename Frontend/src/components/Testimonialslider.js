import React from "react";
import OwlCarousel from 'react-owl-carousel';
import 'owl.carousel/dist/assets/owl.carousel.css';
import 'owl.carousel/dist/assets/owl.theme.default.css';
import './Testimonialslider.css'; 

const Testimonialslider = () => {
    const options = {
        items: 1,
        loop: true,
        margin: 10,
        autoplay: true,
        autoplayTimeout: 4000,
        nav: false,
        dots: false
    };
    return (
        <OwlCarousel className='owl-theme' {...options}>
            <div className='item'>
                <p>Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard 
                dummy text ever since the 1500s</p>
                <h3>Name</h3>
                <span>Designation</span>
            </div>
            <div className='item'>
                <p>Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard 
                dummy text ever since the 1500s</p>
                <h3>Name</h3>
                <span>Designation</span>
            </div>
            <div className='item'>
                <p>Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard 
                dummy text ever since the 1500s</p>
                <h3>Name</h3>
                <span>Designation</span>
            </div>
            <div className='item'>
                <p>Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard 
                dummy text ever since the 1500s</p>
                <h3>Name</h3>
                <span>Designation</span>
            </div>
            <div className='item'>
                <p>Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard 
                dummy text ever since the 1500s</p>
                <h3>Name</h3>
                <span>Designation</span>
            </div>
        </OwlCarousel>
    );
};

export default Testimonialslider;