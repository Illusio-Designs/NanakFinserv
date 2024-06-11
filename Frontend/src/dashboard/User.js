import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './User.css';
import Popup from '../components/user-popup';

const User = () => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [data, setData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState('');
  const [editIndex, setEditIndex] = useState(null);
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');

  useEffect(() => {
    axios.get('http://localhost:3001/api/users')
      .then(response => {
        setData(response.data);
      })
      .catch(error => {
        console.error('Error fetching user data:', error);
      });
  }, []);

  const togglePopup = () => {
    setIsPopupOpen(!isPopupOpen);
  };

  const addEntry = async (entry) => {
    if (editIndex !== null) {
      try {
        const response = await axios.put(`http://localhost:3001/api/users/${data[editIndex].id}`, entry);
        const updatedData = [...data];
        updatedData[editIndex] = response.data;
        setData(updatedData);
        setEditIndex(null);
      } catch (error) {
        console.error('Error updating user:', error);
      }
    } else {
      setData([...data, entry]);
    }
    setIsPopupOpen(false); // Close the popup after saving
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleEdit = (index) => {
    setEditIndex(index);
    setIsPopupOpen(true);
  };

  const handleChangeRowsPerPage = (e) => {
    setItemsPerPage(parseInt(e.target.value));
    setCurrentPage(1);
  };

  const handleSort = (column) => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const filteredData = data.filter(item => 
    Object.values(item).some(val => 
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const sortedData = [...filteredData].sort((a, b) => {
    if (sortColumn) {
      const aValue = String(a[sortColumn]).toLowerCase();
      const bValue = String(b[sortColumn]).toLowerCase();
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    }
    return 0;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentData = sortedData.slice(indexOfFirstItem, indexOfLastItem);

  const pageNumbers = [];
  for (let i = 1; i <= Math.ceil(filteredData.length / itemsPerPage); i++) {
    pageNumbers.push(i);
  }

  const handleClick = (event) => {
    setCurrentPage(Number(event.target.id));
  };

  const renderPageNumbers = pageNumbers.map(number => (
    <li
      key={number}
      id={number}
      onClick={handleClick}
      className={currentPage === number ? 'active' : null}
    >
      {number}
    </li>
  ));

  return (
    <div>
      <div className='user'>
        <div className='title-btn'>
          <h1>User</h1>
          <button className="btn" onClick={togglePopup}>Add</button>
          <Popup 
            isOpen={isPopupOpen} 
            onClose={togglePopup} 
            addEntry={addEntry} 
            initialData={editIndex !== null ? data[editIndex] : null}
          />
        </div>
        <div className="controls">
          <input 
            type="text" 
            placeholder="Search..." 
            value={searchTerm} 
            onChange={handleSearch} 
            className="search-bar"
          />
          <select value={itemsPerPage} onChange={handleChangeRowsPerPage}>
            <option value={5}>5 Rows Per Page</option>
            <option value={10}>10 Rows Per Page</option>
            <option value={20}>20 Rows Per Page</option>
          </select>
        </div>
        {filteredData.length > 0 && (
          <>
            <table className='builder-table'>
              <thead>
                <tr>
                  <th>Serial</th>
                  {Object.keys(filteredData[0]).map((key) => (
                    key !== 'id' && // Exclude 'id' column from table header
                    <th key={key} onClick={() => handleSort(key)}>
                      {key} {sortColumn === key && (
                        sortDirection === 'asc' ? '▲' : '▼'
                      )}
                    </th>
                  ))}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentData.map((item, index) => (
                  <tr key={indexOfFirstItem + index}>
                    <td>{indexOfFirstItem + index + 1}</td>
                    {Object.entries(item).map(([key, value], i) => (
                      key !== 'id' && // Exclude 'id' column data from table rows
                      <td key={i}>{value}</td>
                    ))}
                    <td>
                      <button onClick={() => handleEdit(indexOfFirstItem + index)}>Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <ul className='pagination'>
              {renderPageNumbers}
            </ul>
          </>
        )}
      </div>
    </div>
  );
};

export default User;
