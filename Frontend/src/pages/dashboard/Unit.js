import React, { useEffect, useState } from "react";
import '../../styles/pages/dashboard/Consumer.css';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Button from '../../components/common/Button';
import DashboardLayout from '../../components/DashboardLayout';
import { useNavigate, useParams } from "react-router-dom";
import { getConsumerByUnit, addConsumerUnit, updateConsumerUnit } from '../../serviceAPI/userAPI';
import { useToaster } from '../../components/Toaster';
import Cookies from 'js-cookie';
import FlagDropdown from '../Flag';

const Unit = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [data, setData] = useState(null);
  const [wingData, setWingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedWing, setExpandedWing] = useState(null);
  const [expandedFloors, setExpandedFloors] = useState({});
  const [formData, setFormData] = useState({
    Name: '',
    MobileNumber: '',
    Email: '',
    Sqfeet: '',
    SrNo: '',
    working_status: ''
  });
  const [status, setStatus] = useState('interested');
  const [editData, setEditData] = useState(null);
  const { id } = useParams();
  const navigate = useNavigate();
  const addToast = useToaster();
  const user = Cookies.get('user') && JSON.parse(Cookies.get('user')) || '';

  useEffect(() => {
    fetchUnitData();
  }, []);

  // Set default selected wing when data loads
  useEffect(() => {
    if (wingData && wingData.length > 0 && !expandedWing) {
      setExpandedWing(wingData[0].wingName);
    }
  }, [wingData, expandedWing]);

  const fetchUnitData = async () => {
    setLoading(true);
    try {
      if (id) {
        const response = await getConsumerByUnit({ unit_id: id }, addToast);
        if (response?.data?.length) {
          setData(response.data[0]);
          processWingData(response.data[0]);
        } else {
          throw new Error("No data found");
        }
      } else {
        navigate("/builder/building");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const processWingData = (rawData) => {
    const wings = {};

    ["Showroom", "Office", "Flat", "House"].forEach((categoryName, index) => {
      if (rawData[categoryName]?.length) {
        rawData[categoryName].forEach((wing) => {
          if (!wings[wing.wingName]) {
            wings[wing.wingName] = {
              wingName: wing.wingName,
              categories: [],
            };
          }
          wings[wing.wingName].categories.push({
            name: categoryName,
            id: categoryName == 'Showroom' ? 1 : categoryName == 'Office' ? 2 : categoryName == 'Flat' ? 3 : 4,
            floors: wing.floors.sort((a, b) => a.floorNumber - b.floorNumber),
          });
        });
      }
    });

    setWingData(Object.values(wings));
  };

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
    if (!isModalOpen) {
      setEditData(null);
      resetForm();
    }
  };

  const resetForm = () => {
    setFormData({
      Name: '',
      MobileNumber: '',
      Email: '',
      Sqfeet: '',
      SrNo: '',
      working_status: ''
    });
    setStatus('interested');
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const renderWings = () => {
    return wingData.map((wing) => (
      <div
        key={wing.wingName}
        className={`wing-box ${expandedWing === wing.wingName ? "active" : ""}`}
        onClick={() => handleWingClick(wing.wingName)}
      >
        <span className="wing-title">{wing.wingName}</span>
      </div>
    ));
  };

  const renderFloors = () => {
    if (!expandedWing) return null;

    const selectedWing = wingData.find((wing) => wing.wingName === expandedWing);

    return selectedWing.categories.map((category) => (
      <div key={category.name} className="category-section">
        <h3 className="category-title">{category.name}</h3>
        <div className="floor-container">
          {category.floors.map((floor) => (
            <div key={floor.floorNumber}>
              <div
                className={`floor-box ${expandedFloors[expandedWing]?.includes(floor.floorNumber) ? "active" : ""}`}
                onClick={() => handleFloorClick(floor.floorNumber, expandedWing)}
              >
                Floor {floor.floorNumber}
              </div>
              {expandedFloors[expandedWing]?.includes(floor.floorNumber) && renderUnits(floor, category)}
            </div>
          ))}
        </div>
      </div>
    ));
  };

  const renderUnits = (floor, category) => {
    if (!floor) return null;

    return (
      <div className="unit-grid">
        {Array.from(
          { length: floor.endRange - floor.startRange + 1 },
          (_, idx) => {
            const unitNumber = floor.startRange + idx;
            const consumer = data?.consumerList?.find(
              (c) =>
                c.office_no === String(unitNumber) &&
                c.wing_id === floor.wingId &&
                c.floor_id === floor.floor_id
            );

            return (
              <div
                className={`unit-cell ${consumer ? "occupied" : "vacant"}`}
                key={unitNumber}
                onClick={() => handleUnitClick(consumer, unitNumber, floor, category)}
              >
                Unit {unitNumber}
              </div>
            );
          }
        )}
      </div>
    );
  };

  const handleWingClick = (wingName) => {
    setExpandedWing(wingName);
  };

  const handleFloorClick = (floorNumber, wingName) => {
    setExpandedFloors((prev) => {
      const newExpandedFloors = { ...prev };
      const currentFloors = newExpandedFloors[wingName] || [];

      // If the floor is already expanded, remove it
      if (currentFloors.includes(floorNumber)) {
        newExpandedFloors[wingName] = currentFloors.filter((floor) => floor !== floorNumber);
      } else {
        // If the floor is not expanded, add it to the existing selection
        newExpandedFloors[wingName] = [...currentFloors, floorNumber];
      }

      return newExpandedFloors;
    });
  };

  const handleUnitClick = (consumer, unitNumber, floor, category) => {
    setSelectedUnit({ consumer, unitNumber, floor, category });
    
    if (consumer) {
      setEditData(consumer);
      setFormData({
        Name: consumer['user.username'] || consumer.username || '',
        MobileNumber: consumer['user.mobileNumber'] || consumer.mobileNumber || '',
        Email: consumer['user.email'] || consumer.email || '',
        Sqfeet: consumer['user.sqFeet'] || consumer.sqFeet || consumer.sqfeet || '',
        SrNo: consumer['user.srNo'] || consumer.srNo || consumer.srno || '',
        working_status: consumer['user.user_pk_id.status'] || consumer.status || ''
      });
      setStatus(consumer.status || 'interested');
    } else {
      setEditData(null);
      resetForm();
    }
    
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let userData;
    if (status === 'interested') {
      const regex = /^\d{10}$/;
      if (!regex.test(formData.MobileNumber)) {
        addToast('Mobile number is invalid', 'error');
        return;
      }
      userData = {
        username: formData.Name.trim(),
        mobileNumber: formData.MobileNumber,
        email: formData.Email,
        sqFeet: formData.Sqfeet,
        srNo: formData.SrNo,
        status: status,
        role_id: 5
      };
    } else {
      userData = {
        username: '',
        mobileNumber: '',
        email: '',
        sqFeet: '',
        srNo: '',
        role_id: 5,
        status: status
      };
    }

    userData.unit_id = data.unit_id;
    userData.builder_id = data.builder_id;
    userData.office_no = selectedUnit.unitNumber;
    userData.floor_id = selectedUnit?.floor?.floor_id;
    userData.wing_id = selectedUnit?.floor?.wingId;
    userData.category_id = selectedUnit?.category?.id;
    userData.builder_user_id = data?.['builderuser.user_id'];

    try {
      if (editData && editData.builderConsumerId) {
        userData.builderConsumerId = editData.builderConsumerId;
        userData.user_id = editData.user_id;
        await updateConsumerUnit(userData, addToast);
      } else {
        await addConsumerUnit(userData, addToast);
      }
      
      toggleModal();
      fetchUnitData();
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  if (loading) return (
    <DashboardLayout>
      <div className="consumer-container">
        <p>Loading...</p>
      </div>
    </DashboardLayout>
  );
  
  if (error) return (
    <DashboardLayout>
      <div className="consumer-container">
        <p>Error: {error}</p>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="consumer-container">
        <div className="consumer-header">
          <h1>Building {data?.unit_name}</h1>
      </div>
        
      <div className="unit-container">
        <div className="wing-container">{renderWings()}</div>
        {expandedWing && <div>{renderFloors()}</div>}
      </div>

        <Modal
          open={isModalOpen}
          onClose={toggleModal}
          title={editData ? 'Edit Unit Consumer' : 'Add Unit Consumer'}
        >
          <form onSubmit={handleSubmit} className="consumer-form">
            <div className="form-section status-selection">
              <h5>Status</h5>
              <div className="form-row">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="status"
                    value="interested"
                    checked={status === 'interested'}
                    onChange={() => setStatus('interested')}
                  />
                  <span>Interested</span>
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="status"
                    value="notInterested"
                    checked={status === 'notInterested'}
                    onChange={() => setStatus('notInterested')}
                  />
                  <span>Not Interested</span>
                </label>
              </div>
            </div>

            {status === 'interested' && (
              <>
                <div className="form-section">
                  <h5>Consumer Information</h5>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Name *</label>
                      <Input
                        type="text"
                        value={formData.Name}
                        onChange={(e) => handleInputChange('Name', e.target.value)}
                        placeholder="Enter name"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Mobile Number *</label>
                      <div className='phone-style'>
                        <div className="flag-section">
                          <img
                            src="https://flagcdn.com/w320/in.png"
                            alt="India"
                            className="country-flag"
                          />
                          <span className="country-code">+91</span>
                        </div>
                        <input
                          type="tel"
                          value={formData.MobileNumber}
                          className="form-control mobile"
                          onChange={(e) => handleInputChange('MobileNumber', e.target.value)}
                          placeholder="Enter mobile number"
                          required
                          maxLength="10"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Email</label>
                      <Input
                        type="email"
                        value={formData.Email}
                        onChange={(e) => handleInputChange('Email', e.target.value)}
                        placeholder="Enter email address"
                      />
                    </div>
                    <div className="form-group">
                      <label>Sq. Ft.</label>
                      <Input
                        type="text"
                        value={formData.Sqfeet}
                        onChange={(e) => handleInputChange('Sqfeet', e.target.value)}
                        placeholder="Enter square feet"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Deed Amount</label>
                      <Input
                        type="text"
                        value={formData.SrNo}
                        onChange={(e) => handleInputChange('SrNo', e.target.value)}
                        placeholder="Enter deed amount"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="form-actions">
              <Button
                type="submit"
                className="submit-btn"
              >
                {editData ? 'Update' : 'Add'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default Unit;
