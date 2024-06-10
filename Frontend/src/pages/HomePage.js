import React, { useState, useEffect } from "react";
import Footer from "../components/Footer.js";
import { InfiniteMovingCards } from "../components/infinite-moving-cards.tsx";
import { FlipWords } from "../components/flip-words.tsx";
import Slider from "../components/Slider.js";
import FAQ from "../components/faq.js";
import Popup from "../components/popup.js";
import "./HomePage.css";

const HomePage = () => {
  const [items, setItems] = useState([]);
  const [faqs, setFaqs] = useState([
    {
      question: "How many programmers does it take to screw a lightbulb?",
      answer:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed pharetra lorem eu dolor rhoncus, at scelerisque ligula gravida. Sed porta id mi sit amet convallis. Etiam iaculis massa sit amet lacus blandit sodales. Nulla ultrices velit a diam placerat congue. Pellentesque iaculis, ipsum quis eleifend dapibus, est dui eleifend ante, quis fermentum mi ligula quis nisl. Ut et ex dui. Integer id venenatis quam.",
      open: true,
    },
    {
      question: "Who is the most awesome person?",
      answer: "You! The viewer!",
      open: false,
    },
    {
      question:
        "How many questions does it take to makes a succesful FAQ Page?",
      answer: "This many!",
      open: false,
    },
  ]);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const togglePopup = () => {
    setIsPopupOpen(!isPopupOpen);
  };

  // useEffect(() => {
  //   const fetchedItems = [
  //     {
  //       quote:
  //         "It was the best of times, it was the worst of times, it was the age of wisdom, it was the age of foolishness, it was the epoch of belief, it was the epoch of incredulity, it was the season of Light, it was the season of Darkness, it was the spring of hope, it was the winter of despair.",
  //       name: "Charles Dickens",
  //       title: "A Tale of Two Cities",
  //     },
  //     {
  //       quote:
  //         "It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.",
  //       name: "Jane Austen",
  //       title: "Pride and Prejudice",
  //     },
  //     {
  //       quote:
  //         "Call me Ishmael. Some years ago—never mind how long precisely—having little or no money in my purse, and nothing particular to interest me on shore, I thought I would sail about a little and see the watery part of the world.",
  //       name: "Herman Melville",
  //       title: "Moby-Dick",
  //     },
  //   ];
  //   setItems(fetchedItems);
  // }, []);

  const toggleFAQ = (index) => {
    setFaqs(
      faqs.map((faq, i) => {
        if (i === index) {
          faq.open = !faq.open;
        } else {
          faq.open = false;
        }

        return faq;
      })
    );
  };

  return (
    <div className="home-con">
      <div className="hero-sec-box">
        <h1 className="hero-sec-font">SMARTER WAY TO</h1>
        <img src="./Assets/Hero section img.png" alt="Hero Section"></img>
        <div className="hero-compartment">
          <div className="hero-sec-box-2">
            <h1 className="hero-sec-font">BUY</h1>
          </div>
          <div className="hero-sec-animation">
            <FlipWords words={["Loan", "Insurance", "Mediclaim"]} />
          </div>
        </div>
      </div>

      <div className="contai">
        <div className="half-width-container-1">
          <p>Check our services</p>
          <div className="hf-btn">
              <button className="btn btn-margin">1</button>
              <button className="btn btn-margin">2</button>
              <button className="btn btn-margin">3</button>
              <button className="btn btn-margin">4</button>
          </div>
        </div>
        <div className="img-con">
          <img src="/Assets/family.png" alt="Family" />
        </div>
        <div className="half-width-container-2">
          <h1>What will you do for you?</h1>
          <p>
            Lorem Ipsum is simply dummy text of the printing and typesetting
            industry. Lorem Ipsum has been the industry's standard dummy text
            ever since the 1500s, when an unknown printer took a galley of type
            and scrambled it to make a type specimen book. It has survived not
            only five centuries,
          </p>
          <button className="btn" onClick={togglePopup}>Get Started</button>
          <Popup isOpen={isPopupOpen} onClose={togglePopup} />
        </div>
      </div>

      <div className="float-con overlay">
        <div className="float-con-box-1">
          <h1>Stat we served</h1>
          <p>
            Lorem Ipsum is simply dummy text of the printing and typesetting
            industry. Lorem Ipsum has been the industry's standard dummy text
            ever since the 1500s
          </p>
        </div>
        <div className="float-con-box-2">
          <h1>30M+</h1>
          <p>Shoppers Served</p>
        </div>
        <div className="float-con-box-2">
          <h1>$90B</h1>
          <p>Life Insurance Sold</p>
        </div>
        <div className="float-con-box-2">
          <h1>24/7</h1>
          <p>Help From Experts</p>
        </div>
      </div>

      <div className="container">
        <div className="container-1">
          <h1>
            Our company
            <br /> works with
          </h1>
        </div>
        <div className="container-2">
          <Slider />
        </div>
      </div>

      <div className="cont">
        <div className="cont-1">
          <div className="cont-1-h">
            <h1>
              Why Trust
              <br />
              Our Services ?
            </h1>
          </div>
          <div className="cont-1-p">
            <button>01</button>
            <h6>Smart Tools</h6>
            <p>
              Lorem Ipsum is simply dummy text of the printing and typesetting
              industry. Lorem Ipsum has been the industry's standard dummy text
              ever since the 1500s
            </p>
          </div>
          <div className="cont-1-p">
            <button>02</button>
            <h6>Smart</h6>
            <p>
              Lorem Ipsum is simply dummy text of the printing and typesetting
              industry. Lorem Ipsum has been the industry's standard dummy text
              ever since the 1500s
            </p>
          </div>
        </div>
        <div className="cont-2">
          <div className="img-cont">
            <img src="Assets/workers.png" alt="co-workers"></img>
          </div>
          <div className="cont-2-vert">
            <div className="cont-2-p">
              <button>03</button>
              <h6>Smart Tools</h6>
              <p>
                Lorem Ipsum is simply dummy text of the printing and typesetting
                industry. Lorem Ipsum has been the industry's standard dummy
                text ever since the 1500s
              </p>
            </div>
            <div className="cont-2-p">
              <button>04</button>
              <h6>Smart Tools</h6>
              <p>
                Lorem Ipsum is simply dummy text of the printing and typesetting
                industry. Lorem Ipsum has been the industry's standard dummy
                text ever since the 1500s
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="review-con">
        <InfiniteMovingCards
          items={items}
          direction="left"
          speed="normal"
          className=""
        />
      </div>

      <div className="main-faq">
        <div className="faq-1">
          <img src="/Assets/needtoknow.png"></img>
        </div>
        <div className="faq-2">
          <div className="faqs">
            <h1>Need to know</h1>
            {faqs.map((faq, index) => (
              <FAQ faq={faq} index={index} key={index} toggleFAQ={toggleFAQ} />
            ))}
          </div>
        </div>
      </div>
      <div>
        <Footer />
      </div>
      
    </div>
  );
};

export default HomePage;
