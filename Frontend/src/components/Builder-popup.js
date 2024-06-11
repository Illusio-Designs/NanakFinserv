import React, { useState, useEffect } from 'react';
import './Builder-popup.css';

const Popup = ({ isOpen, onClose, addEntry, initialData }) => {
  const [formValues, setFormValues] = useState({
    name: '',
    builderName: '',
    buildingName: '',
    number: '',
    showroom: false,
    showroomNumber: '',
    office: false,
    officeNumber: '',
    flat: false,
    flatNumber: '',
    mail: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormValues({
        ...initialData,
        showroom: initialData.Showroom !== '',
        showroomNumber: initialData.Showroom,
        office: initialData.Office !== '',
        officeNumber: initialData.Office,
        flat: initialData.Flat !== '',
        flatNumber: initialData.Flat
      });
    } else {
      setFormValues({
        name: '',
        builderName: '',
        buildingName: '',
        number: '',
        showroom: false,
        showroomNumber: '',
        office: false,
        officeNumber: '',
        flat: false,
        flatNumber: '',
        mail: ''
      });
    }
  }, [initialData]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormValues(prevState => ({
      ...prevState,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newEntry = {
      Name: formValues.name,
      'Builder Name': formValues.builderName,
      'Building Name': formValues.buildingName,
      Number: formValues.number,
      Showroom: formValues.showroom ? formValues.showroomNumber : '',
      Office: formValues.office ? formValues.officeNumber : '',
      Flat: formValues.flat ? formValues.flatNumber : '',
      Mail: formValues.mail
    };
    addEntry(newEntry);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup" onClick={(e) => e.stopPropagation()}>
        <button className='close-btn' onClick={onClose}>X</button>
        <form className="popup-form popup-t-p" onSubmit={handleSubmit}>
          <div className='popup-1'>
              <input type="text" name="name" placeholder='Person Name' value={formValues.name} onChange={handleInputChange} required />
              <input type="text" name="builderName" placeholder='Builder Name' value={formValues.builderName} onChange={handleInputChange} required />
          </div>
          <div className='popup-1'>
            <input type="number" name="number" placeholder='Number' value={formValues.number} onChange={handleInputChange} required /> 
            <input type="email" name="mail" placeholder='E-mail' value={formValues.mail} onChange={handleInputChange} />
          </div>
          
          <button type="submit">Submit</button>
        </form>
      </div>
    </div>
  );
};

export default Popup;



{/* <div className='popup-1'>
            <input type="text" name="buildingName" placeholder='Building Name' value={formValues.buildingName} onChange={handleInputChange} required />
          </div>
          <div>
            <h3>Unit</h3>
            <div className='popup-2'>
              <input type="checkbox" name="showroom" checked={formValues.showroom} onChange={handleInputChange} />
              <input
                type="number"
                name="showroomNumber"
                min="0"
                placeholder='Showroom'
                value={formValues.showroomNumber}
                onChange={handleInputChange}
                disabled={!formValues.showroom}
              />
            </div><br />
            <div className='popup-2'>
              <input type="checkbox" name="office" checked={formValues.office} onChange={handleInputChange} />
              <input
                type="number"
                name="officeNumber"
                min="0"
                placeholder='Office'
                value={formValues.officeNumber}
                onChange={handleInputChange}
                disabled={!formValues.office}
              />
            </div><br />
            <div className='popup-2'>
              <input type="checkbox" name="flat" checked={formValues.flat} onChange={handleInputChange} />
              <input
                type="number"
                name="flatNumber"
                min="0"
                placeholder='Flat'
                value={formValues.flatNumber}
                onChange={handleInputChange}
                disabled={!formValues.flat}
              />
            </div>
          </div> */}