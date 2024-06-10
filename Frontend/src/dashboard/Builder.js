import React, { useState } from "react";
import './Builder.css';
import Popup from "../components/Builder-popup";

const Builder = () => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [data, setData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5); // Adjust this number to change the number of items per page
  const [searchTerm, setSearchTerm] = useState('');
  const [editIndex, setEditIndex] = useState(null);
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');

  const togglePopup = () => {
    setIsPopupOpen(!isPopupOpen);
  };

  const addEntry = (entry) => {
    if (editIndex !== null) {
      const newData = [...data];
      newData[editIndex] = entry;
      setData(newData);
      setEditIndex(null);
    } else {
      setData([...data, entry]);
    }
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

  // Filter data based on search term
  const filteredData = data.filter(item => 
    Object.values(item).some(val => 
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Sort data based on the selected column and direction
  const sortedData = [...filteredData].sort((a, b) => {
    if (sortColumn) {
      const aValue = String(a[sortColumn]).toLowerCase();
      const bValue = String(b[sortColumn]).toLowerCase();
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    }
    return 0;
  });

  // Calculate the data to display for the current page
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

  const renderPageNumbers = pageNumbers.map(number => {
    return (
      <li
        key={number}
        id={number}
        onClick={handleClick}
        className={currentPage === number ? 'active' : null}
      >
        {number}
      </li>
    );
  });

  return (
    <div className='builder'>
      <div className='title-btn'>
        <h1>Builder</h1>
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
                  {Object.values(item).map((value, i) => (
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
  );
};

export default Builder;
