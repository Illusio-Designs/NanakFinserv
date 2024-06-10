import React from 'react';
import './Slider.css';

const Slider = () => {
  return (
    <div className="slider">
      <ul>
        <li>
          <img src="/Assets/icici.png" alt="Logo 1" />
        </li>
        <li>
          <img src="/Assets/digit.png" alt="Logo 2" />
        </li>
        <li>
          <img src="https://via.placeholder.com/200?text=Logo%203" alt="Logo 3" />
        </li>
        <li>
          <img src="https://via.placeholder.com/200?text=Logo%204" alt="Logo 4" />
        </li>
        <li>
          <img src="https://via.placeholder.com/200?text=Logo%205" alt="Logo 5" />
        </li>
        <li>
          <img src="https://via.placeholder.com/200?text=Logo%206" alt="Logo 6" />
        </li>
        <li>
          <img src="https://via.placeholder.com/200?text=Logo%207" alt="Logo 7" />
        </li>
      </ul>
    </div>
  );
};

export default Slider;
