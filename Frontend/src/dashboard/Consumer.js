import React from 'react';
import './Consumer.css';

const Consumer = () => {
  const data = [
    { Name: 'John Doe', Age: 28, Occupation: 'Engineer' },
    { Name: 'Jane Smith', Age: 34, Occupation: 'Designer' },
    { Name: 'Samuel Green', Age: 45, Occupation: 'Manager' },
  ];

  return (
    <div className='consumer'>
      <div className='title-btn'>
        <h1>Consumer</h1>
        <button className='btn'>ADD</button>
      </div>
      <table className='consumer-table'>
        <thead>
          <tr>
            {Object.keys(data[0]).map((key) => (
              <th key={key}>{key}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={index}>
              {Object.values(item).map((value, i) => (
                <td key={i}>{value}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Consumer;
