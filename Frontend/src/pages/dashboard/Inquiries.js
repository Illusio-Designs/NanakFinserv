import React, { useEffect, useState } from 'react';
import { getAllInquieries } from '../../serviceAPI/userAPI';
import { useToaster } from '../../components/Toaster';
import DashboardLayout from '../../components/DashboardLayout';
import Table from '../../components/common/Table';
import '../../styles/pages/dashboard/Consumer.css';

const Inquiries = () => {
  const [inquiries, setInquiries] = useState([]);
  const [filteredInquiries, setFilteredInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const addToast = useToaster();

  const headings = [
    { key: 'user_name', title: 'Name' },
    { key: 'email', title: 'Email' },
    { key: 'mobile_no', title: 'Mobile Number' },
    { key: 'services', title: 'Services' },
    { key: 'createdAt', title: 'Created At' }
  ];

  useEffect(() => {
    fetchInquiries();
  }, []);

  const fetchInquiries = async () => {
    try {
      setLoading(true);
      const response = await getAllInquieries();
      if (response && response.data) {
        const formattedData = response.data.map((item) => ({
          user_name: item.user_name || '',
          email: item.email || '',
          mobile_no: item.mobile_no || '',
          services: item.services || '',
          createdAt: new Date(item.createdAt).toLocaleDateString()
        }));
        setInquiries(formattedData);
        setFilteredInquiries(formattedData);
      }
    } catch (error) {
      console.error('Error fetching inquiries:', error);
      addToast('Error fetching inquiries', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (column) => {
    const direction = sortColumn === column && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortColumn(column);
    setSortDirection(direction);
  };

  // Filter data when search query changes
  const handleSearch = (searchQuery) => {
    if (!searchQuery.trim()) {
      setFilteredInquiries(inquiries);
      return;
    }
    
    const filtered = inquiries.filter(row =>
      Object.values(row).some(value =>
        String(value || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
    setFilteredInquiries(filtered);
  };

  return (
    <DashboardLayout onSearch={handleSearch}>
      <div className="consumer-container">
        <div className="consumer-header">
          <h1>Inquiries</h1>
        </div>
        
        <div className="consumer-table-container">
          <Table
            columns={headings}
            data={filteredInquiries}
            pagination={true}
            itemsPerPage={itemsPerPage}
            loading={loading}
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Inquiries; 