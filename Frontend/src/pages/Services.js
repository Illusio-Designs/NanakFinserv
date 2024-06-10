import './Services.css';
import React, { useState } from "react";
import FAQ from "../components/faq";
import Footer from "../components/Footer";

const Services = () => {
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

    return  (
      <div className='banner'>
                <h1>Services Page</h1>
                <div className='ser-1'>
                    <div className='ser-1-1'>
                        <h1>Why life insurance is necessary ?</h1>
                        <p>Knowing that loved ones will be financially protected can bring peace of mind to the policyholder. It reduces anxiety about unforeseen events impacting the family’s financial stability.</p>
                    </div>
                    <div className='ser-1-2'>
                        <img src='/Assets/lifeinsurance.png' />
                    </div>
                </div>
                <div className='ser-2'>
                    <div className='ser-2-2'>
                        <img src='/Assets/loan.png' />
                    </div>
                    <div className='ser-2-1'>
                        <h1>Why Loan is necessary ?</h1>
                        <p>Knowing that loved ones will be financially protected can bring peace of mind to the policyholder. It reduces anxiety about unforeseen events impacting the family’s financial stability.</p>
                    </div>
                </div>
                <div className='ser-3'>
                    <div className='ser-3-1'>
                        <h1>Why Mediclaim is necessary ?</h1>
                        <p>Knowing that loved ones will be financially protected can bring peace of mind to the policyholder. It reduces anxiety about unforeseen events impacting the family’s financial stability.</p>
                    </div>
                    <div className='ser-3-2'>
                        <img src='/Assets/mediclaim.png' />
                    </div>
                </div>
                <div className='ser-4'>
                    <div className='ser-4-2'>
                        <img src='/Assets/vehicleinsurance.png' />
                    </div>
                    <div className='ser-4-1'>
                        <h1>Why Vehicle insurance is necessary ?</h1>
                        <p>Knowing that loved ones will be financially protected can bring peace of mind to the policyholder. It reduces anxiety about unforeseen events impacting the family’s financial stability.</p>
                    </div>
                </div>
                <div className="faqs">
                    <h1>Need to know</h1>
                        {faqs.map((faq, index) => (
                        <FAQ faq={faq} index={index} key={index} toggleFAQ={toggleFAQ} />
                         ))}
                </div>
                <Footer />
            </div>
    )
    
};

export default Services;
