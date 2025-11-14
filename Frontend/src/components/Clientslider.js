import React from "react";
import OwlCarousel from 'react-owl-carousel';
import 'owl.carousel/dist/assets/owl.carousel.css';
import 'owl.carousel/dist/assets/owl.theme.default.css';
import './Clientslider.css'; 

const Clientslider = () => {
    const options = {
        loop: true,
        margin: 40,
        autoplay: true,
        autoplayTimeout: 3000,
        autoplayHoverPause: true,
        animateOut: 'fadeOut',
        animateIn: 'fadeIn',
        nav: false,
        dots: false,
        mouseDrag: true,
        touchDrag: true,
        pullDrag: true,
        freeDrag: false,
        responsive: {
            0: {
                items: 2,
                margin: 20
            },
            576: {
                items: 3,
                margin: 25
            },
            768: {
                items: 4,
                margin: 30
            },
            992: {
                items: 5,
                margin: 35
            },
            1200: {
                items: 6,
                margin: 40
            }
        }
    };

    const clientLogos = [
        { src: "/Assets/slider1.png", alt: "Client Logo 1" },
        { src: "/Assets/slider2.png", alt: "Client Logo 2" },
        { src: "/Assets/slider3.png", alt: "Client Logo 3" },
        { src: "/Assets/slider4.png", alt: "Client Logo 4" },
        { src: "/Assets/slider5.png", alt: "Client Logo 5" },
        { src: "/Assets/slider6.png", alt: "Client Logo 6" },
        { src: "/Assets/slider7.png", alt: "Client Logo 7" },
        { src: "/Assets/slider8.png", alt: "Client Logo 8" }
    ];

    return (
        <div className="clients-slider-container">
            <OwlCarousel className='owl-theme clients-carousel' {...options}>
                {clientLogos.map((logo, index) => (
                    <div className='item client-logo-item' key={index}>
                        <div className="logo-wrapper">
                            <img 
                                src={logo.src} 
                                alt={logo.alt} 
                                className="client-logo img-fluid" 
                            />
            </div>
            </div>
                ))}
            </OwlCarousel>
            </div>                
    );
};

export default Clientslider;