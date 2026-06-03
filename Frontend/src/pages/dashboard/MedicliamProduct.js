import toast from 'react-hot-toast';


import React, { useEffect, useState } from 'react';
import '../../styles/pages/dashboard/Consumer.css';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import DashboardLayout from '../../components/DashboardLayout';
import { getAllMediclaimProduct } from '../../serviceAPI/userAPI';
import { useToaster } from '../../components/Toaster';
import { useNavigate, useParams } from 'react-router';
import MediclaimProductModal from '../../components/MediclaimProductModal';
import * as XLSX from 'xlsx';
import config from '../../config/apiConfig';

const MediclaimProduct = () => {
    const addToast = useToaster();
    const navigate = useNavigate();
    const { id } = useParams();

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
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [viewData, setViewData] = useState(null);

    const toggleModal = () => {
        setIsModalOpen(!isModalOpen);
        if (!isModalOpen) {
            setEditData(null);
        }
    };

    const toggleViewModal = () => {
        console.log('toggleViewModal called, current state:', isViewModalOpen);
        setIsViewModalOpen(!isViewModalOpen);
        if (isViewModalOpen) {
            console.log('Closing modal, clearing view data');
            setViewData(null);
        } else {
            console.log('Opening modal');
        }
    };

    useEffect(() => {
        getAllMediclaimCompanyData();
    }, [id]);

    const handleViewClick = (item) => {
        console.log('View clicked for item:', item);
        console.log('Setting view data:', item);
        setViewData(item);
        console.log('Opening view modal...');
        toggleViewModal();
    };

    const getAllMediclaimCompanyData = async () => {
        if (id) {
            try {
                setLoading(true);
                let obj = { mediclaim_company_id: id };
                const consumerData = await getAllMediclaimProduct(obj);
                console.log('Raw product data:', consumerData);
                
                if (consumerData?.data && consumerData?.data?.length) {
                    const processedData = consumerData?.data.map(item => {
                        console.log('Processing item:', item);
                        return {
                            ...item,
                            pdfs_display: item.mediclaimproductpdfs && item.mediclaimproductpdfs.length > 0 ? (
                                <div>
                                    {item.mediclaimproductpdfs.map((pdf, index) => {
                                                        // pdf_path contains /uploads/companyProduct/.../filename - use BASE_URL for static serving
                                                        return (
                                        <div key={index} style={{ marginBottom: '5px' }}>
                                            {pdf.pdf_path ? (
                                                <a
                                                    href={`${config.BASE_URL}${pdf.pdf_path}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{ 
                                                        color: '#1976d2', 
                                                        textDecoration: 'underline',
                                                        cursor: 'pointer',
                                                        fontSize: '12px'
                                                    }}
                                                    download
                                                    onClick={async (e) => {
                                                        try {
                                                            const response = await fetch(`${config.BASE_URL}${pdf.pdf_path}`);
                                                            if (!response.ok) {
                                                                e.preventDefault();
                                                                toast.error('Document not available. Please check the file.');
                                                            }
                                                        } catch (error) {
                                                            e.preventDefault();
                                                            toast.error('Document not available. Please check the file.');
                                                        }
                                                    }}
                                                >
                                                    📄 {pdf.pdf_name || `PDF ${index + 1}`}
                                                </a>
                                            ) : (
                                            <span style={{ fontSize: '12px', color: '#666' }}>
                                                {pdf.pdf_name || `PDF ${index + 1}`}
                                            </span>
                                            )}
                                        </div>
                                                        );
                                                    })}
                                </div>
                            ) : (
                                <span style={{ color: '#999', fontSize: '12px' }}>No PDFs</span>
                            ),
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
                                    View Details
                                </button>
                            )
                        };
                    });
                    console.log('Processed data:', processedData);
                    setData(processedData);
                    setFilteredData(processedData);
                } else {
                    console.log('No product data found');
                    setData([]);
                    setFilteredData([]);
                }
                setHeading([
                    { key: 'mediclaim_product_name', head: 'Product Name' }, 
                    { key: 'pdfs_display', head: 'PDFs' },
                    { key: 'view', head: 'Actions' }
                ]);
            } catch (error) {
                console.error('Error fetching product data:', error);
                setData([]);
                setFilteredData([]);
            } finally {
                setLoading(false);
            }
        }
    };

    const handleEdit = (userData) => {
        const globalIndex = data.findIndex((item) => item.mediclaim_product_id === userData.mediclaim_product_id);
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
                    <h1>Mediclaim Product Management</h1>
                    <Button className="add-consumer-btn" onClick={toggleModal}>+ Add Product</Button>
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
                    <MediclaimProductModal
                        isOpen={isModalOpen}
                        onClose={toggleModal}
                        fetchApi={fetchApi}
                        initialData={editData}
                    />
                )}

                {/* View Product Details Modal */}
                {isViewModalOpen && viewData && (
                    <Modal
                        open={isViewModalOpen}
                        onClose={toggleViewModal}
                        title="Product Details"
                    >
                        <div className="consumer-form">
                            <div className="form-section">
                                <h5>Product Information</h5>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Product Name:</label>
                                        <span className="detail-value">{viewData.mediclaim_product_name || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="form-section">
                                <h5>PDF Documents</h5>
                                {viewData.mediclaimproductpdfs && viewData.mediclaimproductpdfs.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        {viewData.mediclaimproductpdfs.map((pdf, index) => (
                                            <div key={index} style={{ 
                                                marginTop: '8px', 
                                                padding: '10px',
                                                backgroundColor: '#f0f7ff',
                                                borderRadius: '4px',
                                                border: '1px solid #d0e7ff',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center'
                                            }}>
                                                <div style={{ 
                                                    fontSize: "0.9em", 
                                                    color: "#1e293b",
                                                    fontWeight: '500'
                                                }}>
                                                    📄 {pdf.pdf_name || `Document ${index + 1}`}
                                                </div>
                                                {pdf.pdf_path && (
                                                    <button
                                                        type="button"
                                                        onClick={() => window.open(`${config.BASE_URL}${pdf.pdf_path}`, '_blank')}
                                                        style={{ 
                                                            padding: '6px 14px',
                                                            backgroundColor: '#1976d2',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer',
                                                            fontSize: '0.85em',
                                                            fontWeight: '500',
                                                            transition: 'background-color 0.2s'
                                                        }}
                                                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1565c0'}
                                                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1976d2'}
                                                    >
                                                        📥 Download
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p style={{ color: '#999', fontStyle: 'italic' }}>No PDF documents available</p>
                                )}
                            </div>

                            <div className="form-actions">
                                <Button
                                    type="button"
                                    className="cancel-btn"
                                    onClick={toggleViewModal}
                                >
                                    Close
                                </Button>
                            </div>
                        </div>
                    </Modal>
                )}
            </div>
        </DashboardLayout>
    );
};

export default MediclaimProduct;
