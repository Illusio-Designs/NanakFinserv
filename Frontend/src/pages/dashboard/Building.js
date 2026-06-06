import { ROLE_IDS } from "../../config/ids";
import React, { useEffect, useState } from "react";
import '../../styles/pages/dashboard/Consumer.css';
import Table from "../../components/common/Table";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import Input from "../../components/common/Input";
import Select from "../../components/common/Select";
import DashboardLayout from '../../components/DashboardLayout';
import { getAllBuilders, getUnitsByBuilder, addUnitByBuilder, updateUnitByBuilder, createBuildingManager, assignBuildingManager } from "../../serviceAPI/userAPI";
import { useNavigate, useParams } from "react-router-dom";
import viewImage from './view.png';
import Cookies from 'js-cookie';

const Building = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [data, setData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [editData, setEditData] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);
    const [sortColumn, setSortColumn] = useState(null);
    const [sortDirection, setSortDirection] = useState('asc');
    const [heading, setHeading] = useState([]);
    const [loading, setLoading] = useState(false);
    const [builderData, setBuilderData] = useState([]);
    const [formData, setFormData] = useState({
        unit_name: '',
        address: '',
        builder_id: '',
        building_manager_name: '',
        building_manager_email: '',
        building_manager_mobile: ''
    });
    const [checkboxes, setCheckboxes] = useState({
        Showroom: false,
        Flat: false,
        Office: false,
        House: false
    });
    const [categoriesData, setCategoriesData] = useState({
        Showroom: [],
        Flat: [],
        Office: [],
        House: []
    });
    const [totalEntities, setTotalEntities] = useState(0);
    const navigate = useNavigate();

    const user = Cookies.get('user') && JSON.parse(Cookies.get('user')) || '';

    const toggleModal = () => {
        setIsModalOpen(!isModalOpen);
        if (!isModalOpen) {
            setEditData(null);
            resetForm();
            // Set default builder if available
            if (builderData.length > 0) {
                setFormData(prev => ({ ...prev, builder_id: builderData[0]['builderuser.builder_id'] }));
            }
        }
    };

    const resetForm = () => {
        setFormData({
            unit_name: '',
            address: '',
            builder_id: '',
            building_manager_name: '',
            building_manager_email: '',
            building_manager_mobile: ''
        });
        setCheckboxes({
            Showroom: false,
            Flat: false,
            Office: false,
            House: false
        });
        setCategoriesData({
            Showroom: [],
            Flat: [],
            Office: [],
            House: []
        });
        setTotalEntities(0);
    };

    useEffect(() => {
        getBuilderUnitData();
        getBuilderData();
    }, []);

    useEffect(() => {
        if (builderData.length > 0 && !formData.builder_id) {
            setFormData(prev => ({ ...prev, builder_id: builderData[0]['builderuser.builder_id'] }));
        }
    }, [builderData]);

    const getBuilderData = async () => {
        try {
            const builderData = await getAllBuilders();
            console.log('Raw builder data:', builderData);
            if (builderData?.data?.length > 0) {
                setBuilderData(builderData.data);
                if (!formData.builder_id) {
                    setFormData(prev => ({ ...prev, builder_id: builderData.data[0]['builderuser.builder_id'] }));
                }
            }
        } catch (error) {
            console.error('Error fetching builder data:', error);
        }
    };

    const getBuilderUnitData = async () => {
        setLoading(true);
        const builderData = await getUnitsByBuilder();
        if (builderData?.data && builderData?.data?.length) {
            // Add view image to each data row
            const processedData = builderData.data.map(item => ({
                ...item,
                view: <a><img className="building-view" src={viewImage} alt="View" style={{ cursor: 'pointer' }} onClick={() => handleViewClick(item)} /></a>
            }));
            setData(processedData);
            setFilteredData(processedData);
        } else {
            setData([]);
            setFilteredData([]);
        }
        setHeading([{ key: 'unit_name', head: 'Unit Name' }, { key: 'address', head: 'Address' }, { key: 'builderuser.company_name', head: 'Company Name' }, { key: 'unit_showroomCount', head: 'Showroom' }, { key: 'unit_officeCount', head: 'Office' }, { key: 'unit_flatCount', head: 'Flat' }, { key: 'unit_houseCount', head: 'House' }, { key: 'view', head: 'View' }]);
        setLoading(false);
    };

    const handleEdit = (userData) => {
        setEditData(userData);
        
        // Debug: Log the userData to see what we're receiving
        console.log('Edit Building - userData:', userData);
        console.log('Building Manager Data:', {
            name: userData.building_manager_name,
            email: userData.building_manager_email,
            mobile: userData.building_manager_mobile
        });
        
        // Set form data
        setFormData({
            unit_name: userData.unit_name || '',
            address: userData.address || '',
            builder_id: userData.builder_id || userData['builderuser.builder_id'] || '',
            building_manager_name: userData.building_manager_name || '',
            building_manager_email: userData.building_manager_email || '',
            building_manager_mobile: userData.building_manager_mobile || ''
        });

        setCheckboxes({
            Showroom: userData.unit_categories?.includes('1') || false,
            Flat: userData.unit_categories?.includes('3') || false,
            Office: userData.unit_categories?.includes('2') || false,
            House: userData.unit_categories?.includes('4') || false
        });

        setCategoriesData({
            Showroom: userData?.Showroom?.wings || [],
            Flat: userData?.Flat?.wings || [],
            Office: userData?.Office?.wings || [],
            House: userData?.House?.wings || []
        });

        setIsModalOpen(true);
    };

    const handleViewClick = (item) => {
        console.log('View clicked for item:', item);
        navigate(`/unit/${item.unit_id}`);
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleCheckboxChange = (e) => {
        const { name, checked } = e.target;
        setCheckboxes(prevState => ({
            ...prevState,
            [name]: checked
        }));

        if (checked) {
            setCategoriesData((prev) => ({
                ...prev,
                [name]: [{
                    wingName: 'Wing 1',
                    floors: [{
                        floorNumber: 1,
                        startRange: 1,
                        endRange: 5
                    }]
                }]
            }));
        } else {
            setCategoriesData((prev) => ({
                ...prev,
                [name]: []
            }));
        }
        updateTotalEntities();
    };

    const addWing = (category) => {
        setCategoriesData((prev) => {
            const newWing = {
                wingName: `Wing ${prev[category].length + 1}`,
                floors: [{
                    floorNumber: 1,
                    startRange: 1,
                    endRange: 5
                }]
            };
            return {
                ...prev,
                [category]: [...prev[category], newWing]
            };
        });
        updateTotalEntities();
    };

    const removeWing = (category, wingIndex) => {
        setCategoriesData((prev) => {
            const newCategoriesData = { ...prev };
            newCategoriesData[category].splice(wingIndex, 1);
            return newCategoriesData;
        });
        updateTotalEntities();
    };

    const addFloor = (category, wingIndex) => {
        const newCategoriesData = { ...categoriesData };
        const wing = newCategoriesData[category][wingIndex];
        const lastFloor = wing.floors[wing.floors.length - 1];

        const newFloor = {
            floorNumber: lastFloor ? lastFloor.floorNumber + 1 : 1,
            startRange: lastFloor ? lastFloor.endRange + 1 : 1,
            endRange: lastFloor ? lastFloor.endRange + 5 : 5,
        };

        wing.floors.push(newFloor);
        setCategoriesData(newCategoriesData);
        updateTotalEntities();
    };

    const removeFloor = (category, wingIndex) => {
        const newCategoriesData = { ...categoriesData };
        const wing = newCategoriesData[category][wingIndex];
        if (wing.floors.length > 1) {
            wing.floors.pop();
        }
        setCategoriesData(newCategoriesData);
        updateTotalEntities();
    };

    const updateFloorRange = (category, wingIndex, floorIndex, field, value) => {
        const newCategoriesData = { ...categoriesData };
        const wing = newCategoriesData[category][wingIndex];
        const floor = wing.floors[floorIndex];
        const newValue = parseInt(value);
        floor[field] = newValue;
        setCategoriesData(newCategoriesData);
        updateTotalEntities();
    };

    const handleWingNameChange = (category, wingIndex, newWingName) => {
        setCategoriesData((prev) => {
            const newCategoriesData = { ...prev };
            newCategoriesData[category][wingIndex].wingName = newWingName;
            return newCategoriesData;
        });
    };

    const updateTotalEntities = () => {
        let total = 0;
        Object.keys(categoriesData).forEach((category) => {
            categoriesData[category].forEach((wing) => {
                wing.floors.forEach((floor) => {
                    total += floor.endRange - floor.startRange + 1;
                });
            });
        });
        setTotalEntities(total);
    };

    const transformAndCalculateSummary = (data) => {
        const transformedData = {};

        Object.keys(data).forEach((category) => {
            const details = data[category];
            let totalCount = 0;
            let wingCount = 0;
            let floorCount = 0;

            details.forEach((wing) => {
                wingCount++;
                wing.floors.forEach((floor) => {
                    floorCount++;
                    totalCount += floor.endRange - floor.startRange + 1;
                });
            });

            transformedData[category] = {
                wings: details,
                summary: {
                    totalCount,
                    wingCount,
                    floorCount,
                },
            };
        });

        return transformedData;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const transformedCategoriesData = transformAndCalculateSummary(categoriesData);

            const userData = {
                unit_name: formData.unit_name.trim(),
                address: formData.address,
                builder_id: formData.builder_id,
                Showroom: checkboxes.Showroom ? transformedCategoriesData.Showroom : [],
                Flat: checkboxes.Flat ? transformedCategoriesData.Flat : [],
                Office: checkboxes.Office ? transformedCategoriesData.Office : [],
                House: checkboxes.House ? transformedCategoriesData.House : []
            };

            const unitCategories = [
                { name: 'Showroom', id: 1 },
                { name: 'Flat', id: 3 },
                { name: 'Office', id: 2 },
                { name: 'House', id: 4 }
            ];

            userData.unit_categories = unitCategories
                .filter((category) => checkboxes[category.name])
                .map((category) => String(category.id));

            let createdUnit;
            if (editData && editData.unit_id) {
                userData.unit_id = editData.unit_id;
                await updateUnitByBuilder(userData);
                createdUnit = editData;
            } else {
                createdUnit = await addUnitByBuilder(userData);
            }

            // Create building manager if information is provided
            if (formData.building_manager_name && formData.building_manager_email && formData.building_manager_mobile) {
                try {
                    const buildingManagerData = {
                        username: formData.building_manager_name.trim(),
                        email: formData.building_manager_email.trim(),
                        mobileNumber: formData.building_manager_mobile.trim(),
                        unit_id: editData ? editData.unit_id : createdUnit.data.unit_id,
                        address: formData.address || '',
                        pincode: '',
                        city: '',
                        state: '',
                        created_by: user.user_id || 1
                    };

                    const createdManager = await createBuildingManager(buildingManagerData);
                    
                    if (createdManager && createdManager.status) {
                        console.log('Building manager created and assigned successfully');
                    }
                } catch (managerError) {
                    console.error('Error creating building manager:', managerError);
                    // Don't fail the entire operation if manager creation fails
                }
            }

            toggleModal();
            getBuilderUnitData();
        } catch (error) {
            console.error('Error submitting form:', error);
        } finally {
            setLoading(false);
        }
    };

    // Filter data when search query changes
    const handleSearch = (searchQuery) => {
        if (!searchQuery.trim()) {
            setFilteredData(data);
            return;
        }

        const filtered = data.filter(row =>
            Object.values(row).some(value =>
                String(value || '').toLowerCase().includes(searchQuery.toLowerCase())
            )
        );
        setFilteredData(filtered);
    };

    return (
        <DashboardLayout onSearch={handleSearch}>
            <div className="consumer-container">
                <div className="consumer-header">
                    <h1>Building Management</h1>
                    {user.Role !== ROLE_IDS.BUILDING_MANAGER && (
                    <Button 
                        className="add-consumer-btn" 
                        onClick={toggleModal}
                    >
                        + Add Building
                    </Button>
                    )}
            </div>

                <div className="consumer-table-container">
                <Table
                    columns={heading.map(h => ({ key: h.key, title: h.head }))}
                        data={filteredData}
                    onEdit={handleEdit}
                    pagination={true}
                    itemsPerPage={itemsPerPage}
                    loading={loading}
                />
                </div>

                <Modal
                    open={isModalOpen}
                    onClose={toggleModal}
                    title={editData ? 'Edit Building' : 'Add New Building'}
                >
                    <form onSubmit={handleSubmit} className="consumer-form">
                        <div className="form-section">
                            <h5>Basic Information</h5>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Select Builder *</label>
                                    <select
                                        value={formData.builder_id || ''}
                                        onChange={(e) => handleInputChange('builder_id', e.target.value)}
                                        className="form-control"
                                        required
                                    >
                                        <option value="">Select Builder</option>
                                        {builderData.map(item => (
                                            <option key={item['builderuser.builder_id']} value={item['builderuser.builder_id']}>
                                                {item['builderuser.company_name']}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Building Name *</label>
                                    <Input
                                        type="text"
                                        value={formData.unit_name}
                                        onChange={(e) => handleInputChange('unit_name', e.target.value)}
                                        placeholder="Enter building name"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Address *</label>
                                    <textarea
                                        value={formData.address}
                                        onChange={(e) => handleInputChange('address', e.target.value)}
                                        placeholder="Enter address"
                                        className="form-control"
                                        rows="3"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="form-section">
                            <h5>Building Manager Information</h5>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Manager Name</label>
                                    <Input
                                        type="text"
                                        value={formData.building_manager_name}
                                        onChange={(e) => handleInputChange('building_manager_name', e.target.value)}
                                        placeholder="Enter building manager name"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Manager Email</label>
                                    <Input
                                        type="email"
                                        value={formData.building_manager_email}
                                        onChange={(e) => handleInputChange('building_manager_email', e.target.value)}
                                        placeholder="Enter building manager email"
                                    />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Manager Mobile</label>
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
                                            value={formData.building_manager_mobile} 
                                            className="form-control mobile" 
                                            onChange={(e) => handleInputChange('building_manager_mobile', e.target.value)} 
                                            placeholder="Enter building manager mobile number" 
                                            maxLength="10"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="categories-section">
                            <h4>Assign Category</h4>
                            <div className="category-grid">
                                {Object.keys(checkboxes).map((category) => (
                                    <div key={category} className="category-item">
                                        <div className="category-header">
                                            <label className="checkbox-label">
                                                <input
                                                    type="checkbox"
                                                    checked={checkboxes[category]}
                                                    onChange={handleCheckboxChange}
                                                    name={category}
                                                />
                                                <span className="category-name">{category}</span>
                                            </label>
                                        </div>
                                        {checkboxes[category] && (
                                            <div className="category-details">
                                                {categoriesData[category].map((wing, wingIndex) => (
                                                    <div key={wingIndex} className="wing-details">
                                                        <div className="wing-header">
                                                            <div className="wing-name-section">
                                                                <label>Wing Name:</label>
                                                                <Input
                                                                    type="text"
                                                                    value={wing.wingName}
                                                                    onChange={(e) => handleWingNameChange(category, wingIndex, e.target.value)}
                                                                    placeholder="Enter wing name"
                                                                    className="wing-name-input"
                                                                />
                                                            </div>
                                                            <div className="wing-actions">
                                                                <Button
                                                                    type="button"
                                                                    className="btn-sm btn-primary"
                                                                    onClick={() => addFloor(category, wingIndex)}
                                                                >
                                                                    + Add Floor
                                                                </Button>
                                                                <Button
                                                                    type="button"
                                                                    className="btn-sm btn-secondary"
                                                                    onClick={() => removeFloor(category, wingIndex)}
                                                                >
                                                                    - Remove Floor
                                                                </Button>
                                                                <Button
                                                                    type="button"
                                                                    className="btn-sm btn-danger"
                                                                    onClick={() => removeWing(category, wingIndex)}
                                                                >
                                                                    × Remove Wing
                                                                </Button>
                                                            </div>
                                                        </div>
                                                        <div className="floors-container">
                                                            {wing.floors.map((floor, floorIndex) => (
                                                                <div key={floorIndex} className="floor-details">
                                                                    <div className="floor-header">
                                                                        <span className="floor-number">Floor {floor.floorNumber}</span>
                                                                    </div>
                                                                    <div className="floor-range">
                                                                        <label>Unit Range:</label>
                                                                        <div className="range-inputs">
                                                                            <Input
                                                                                type="number"
                                                                                value={floor.startRange}
                                                                                onChange={(e) => updateFloorRange(category, wingIndex, floorIndex, 'startRange', e.target.value)}
                                                                                placeholder="Start"
                                                                                className="range-input"
                                                                                min="1"
                                                                            />
                                                                            <span className="range-separator">to</span>
                                                                            <Input
                                                                                type="number"
                                                                                value={floor.endRange}
                                                                                onChange={(e) => updateFloorRange(category, wingIndex, floorIndex, 'endRange', e.target.value)}
                                                                                placeholder="End"
                                                                                className="range-input"
                                                                                min="1"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                                <div className="add-wing-section">
                                                    <Button
                                                        type="button"
                                                        className="btn-primary"
                                                        onClick={() => addWing(category)}
                                                    >
                                                        + Add New Wing
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="form-actions">
                            <Button
                                type="submit"
                                className="submit-btn"
                                disabled={loading}
                            >
                                {loading ? 'Saving...' : (editData ? 'Update' : 'Save')}
                            </Button>
                        </div>
                    </form>
                </Modal>
            </div>
        </DashboardLayout>
    );
};

export default Building;
