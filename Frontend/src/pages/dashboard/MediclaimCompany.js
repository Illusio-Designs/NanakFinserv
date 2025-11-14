

import React, { useEffect, useState } from 'react';
import '../../styles/pages/dashboard/Consumer.css';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import DashboardLayout from '../../components/DashboardLayout';
import { getAllMediclaimCompany } from '../../serviceAPI/userAPI';
import { useToaster } from '../../components/Toaster';
import { useNavigate } from 'react-router';
import MediclaimCompanyModal from '../../components/MediclaimCompanyModal';
import * as XLSX from 'xlsx';

const MediclaimCompany = () => {
    const addToast = useToaster();
    const navigate = useNavigate();

    const [data, setData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editData, setEditData] = useState(null);
    const [heading, setHeading] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);
    const [sortColumn, setSortColumn] = useState(null);
    const [sortDirection, setSortDirection] = useState('asc');
    const [loading, setLoading] = useState(false);

    const toggleModal = () => {
        setIsModalOpen(!isModalOpen);
        if (!isModalOpen) {
            setEditData(null);
        }
    };

    useEffect(() => {
        getAllMediclaimCompanyData();
    }, []);

    const handleViewClick = (item) => {
        console.log('View clicked for item:', item);
        navigate(`/mediclaim/company/${item.mediclaim_company_id}`);
    };

    const getAllMediclaimCompanyData = async () => {
        setLoading(true);
        try {
            console.log('🔍 Calling getAllMediclaimCompany API...');
            const companyData = await getAllMediclaimCompany();
            console.log('🔍 getAllMediclaimCompanyData - raw API response:', companyData);
            
            if (companyData && companyData?.data && companyData?.data?.length) {
                const processedData = companyData?.data.map(item => {
                    console.log('🔍 Processing company item:', item);
                    return {
                        ...item,
                        view: (
                            <button 
                                className="view-btn" 
                                onClick={() => handleViewClick(item)}
                                style={{
                                    cursor: 'pointer',
                                    padding: '8px 16px',
                                    border: 'none',
                                    borderRadius: '6px',
                                    background: '#e0e7ff',
                                    color: '#3730a3',
                                    fontSize: '14px'
                                }}
                            >
                                View Products
                            </button>
                        )
                    };
                });
                console.log('🔍 Processed company data:', processedData);
                setData(processedData);
                setFilteredData(processedData);
            } else {
                console.log('🔍 No company data found or empty response');
                console.log('🔍 companyData:', companyData);
                console.log('🔍 companyData?.data:', companyData?.data);
                setData([]);
                setFilteredData([]);
            }
            setHeading([
                { key: 'mediclaim_company_name', head: 'Company Name' }, 
                { key: 'view', head: 'Actions' }
            ]);
        } catch (error) {
            console.error('🔍 Error in getAllMediclaimCompanyData:', error);
            setData([]);
            setFilteredData([]);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (userData) => {
        const globalIndex = data.findIndex((item) => item.mediclaim_company_id === userData.mediclaim_company_id);
        if (globalIndex !== -1) {
            setEditData(data[globalIndex]);
            setIsModalOpen(true);
        }
    };

    const handleSort = (column) => {
        const direction = sortColumn === column && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortColumn(column);
        setSortDirection(direction);
    };

    const fetchApi = () => {
        getAllMediclaimCompanyData();
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
                    <h1>Mediclaim Company Management</h1>
                    <div>
                        <Button className="add-consumer-btn" onClick={toggleModal}>+ Add Company</Button>
                    </div>
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

                {isModalOpen && (
                    <MediclaimCompanyModal
                        isOpen={isModalOpen}
                        onClose={toggleModal}
                        fetchApi={fetchApi}
                        initialData={editData}
                    />
                )}
            </div>
        </DashboardLayout>
    );
};

export default MediclaimCompany;
