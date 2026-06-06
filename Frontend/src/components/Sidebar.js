import { ROLE_IDS, CATEGORY_IDS } from "../config/ids";
import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';
import Cookies from 'js-cookie';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const [activeTab, setActiveTab] = useState('');
  const [openSubmenus, setOpenSubmenus] = useState(() => {
    // Retrieve submenu state from localStorage on initial load
    const storedState = localStorage.getItem('openSubmenus');
    return storedState ? JSON.parse(storedState) : {};
  });

  const location = useLocation();

  useEffect(() => {
    setActiveTab(location.pathname);

    // Automatically open submenu based on the current route
    const activePath = location.pathname.split('/')[1]; // e.g., 'builder', 'loan', etc.
    if (activePath) {
      // Only open the submenu for the current active path, close all others
      setOpenSubmenus({
        [activePath]: true, // Open the submenu based on path
      });
    }
  }, [location.pathname]);


  const categoryId = Cookies.get('category');
  const user = (Cookies.get('user') && JSON.parse(Cookies.get('user'))) || '';

  const handleLinkClick = () => {
    toggleSidebar();
  };

  const handleLogout = () => {
    Cookies.remove('user');
    Cookies.remove('token');
    window.location.reload();
  };

  const toggleSubmenu = (submenuKey) => {
    // If the clicked submenu is already open, close it
    // Otherwise, close all submenus and open only the clicked one
    const isCurrentlyOpen = openSubmenus[submenuKey];
    const updatedSubmenus = isCurrentlyOpen
      ? {} // Close all submenus including the current one
      : { [submenuKey]: true }; // Close all others and open only the clicked one

    setOpenSubmenus(updatedSubmenus);

    // Save updated submenu state to localStorage
    localStorage.setItem('openSubmenus', JSON.stringify(updatedSubmenus));
  };

  const isUnitRoute = location?.pathname?.startsWith('/unit/');

  return (
    <div className={`sidebar ${isOpen ? 'open' : 'close'}`} id="sidebar">
      <div className="sidebar-header">
        <img className="sidebar-logo cropped-logo" src="../Assets/cropped-logo.png" alt="Logo" />
        <img className="sidebar-logo text-logo" src="../Assets/text-logo.png" alt="Logo" />
      </div>

      <ul className="menu">
        {user && user.role_id !== ROLE_IDS.BUILDER && <li className={`${activeTab === '/dashboard' && 'active'}`}>
          <Link to="/dashboard" onClick={handleLinkClick}>
            <i className="bi bi-speedometer2"></i>
            <span>Dashboard</span>
          </Link>
        </li>}

        {(user && (user.role_id === ROLE_IDS.SUPER_ADMIN || user.role_id === ROLE_IDS.BUILDER)) && <li className={`${activeTab === '/consumer' && 'active'}`}>
          <Link to="/consumer" onClick={handleLinkClick}>
            <i className="bi bi-person"></i>
            <span>Consumer</span>
          </Link>
        </li>}

        {/* Building Manager Menu */}
        {user && user.role_id === ROLE_IDS.BUILDING_MANAGER && (
          <>
            <li className={`${activeTab === '/builder/building' && 'active'}`}>
              <Link to="/builder/building" onClick={handleLinkClick}>
                <i className="bi bi-building"></i>
                <span>My Buildings</span>
              </Link>
            </li>
            <li className={`${activeTab === '/consumer' && 'active'}`}>
              <Link to="/consumer" onClick={handleLinkClick}>
                <i className="bi bi-person"></i>
                <span>Residents</span>
              </Link>
            </li>
          </>
        )}

        {(user && (user.role_id === ROLE_IDS.SUPER_ADMIN || user.role_id === ROLE_IDS.BUILDER)) && (
          <li>
            <div
              className={`submenu-toggle ${openSubmenus['builder'] ? 'open' : ''}`}
              onClick={() => toggleSubmenu('builder')}
            >
              <i className="bi bi-buildings"></i>
              <span>Builder</span>
              <i className={`submenu-arrow bi ${openSubmenus['builder'] ? 'bi-chevron-up' : 'bi-chevron-down'}`}></i>
            </div>
            <ul className={`submenu ${openSubmenus['builder'] ? 'open' : ''}`}>
              <li className={`${activeTab === '/builder' && 'active'}`}>
                <Link to="/builder" onClick={handleLinkClick}>
                  <span>Builder</span>
                </Link>
              </li>
            </ul>
            <ul className={`submenu ${openSubmenus['builder'] ? 'open' : ''}`}>
              <li className={`${(activeTab === '/builder/building' || location.pathname.startsWith('/unit/')) && 'active'}`}>
                <Link to="/builder/building" onClick={handleLinkClick}>
                  <span>Building</span>
                </Link>
              </li>
            </ul>
          </li>
        )}

        {((user && user.role_id === ROLE_IDS.SUPER_ADMIN) || (categoryId && categoryId.includes(CATEGORY_IDS.LOAN))) && (
          <li>
            <div
              className={`submenu-toggle ${openSubmenus['loan'] ? 'open' : ''}`}
              onClick={() => toggleSubmenu('loan')}
            >
              <i className="bi bi-cash-coin"></i>
              <span>Loan</span>
              <i className={`submenu-arrow bi ${openSubmenus['loan'] ? 'bi-chevron-up' : 'bi-chevron-down'}`}></i>
            </div>
            <ul className={`submenu ${openSubmenus['loan'] ? 'open' : ''}`}>
              <li className={`${activeTab === '/loan' && 'active'}`}>
                <Link to="/loan" onClick={handleLinkClick}>
                  Consumer
                </Link>
              </li>
              <li className={`${activeTab === '/loan/interested' && 'active'}`}>
                <Link to="/loan/interested" onClick={handleLinkClick}>
                  Interested
                </Link>
              </li>
              <li className={`${activeTab === '/loan/completed' && 'active'}`}>
                <Link to="/loan/completed" onClick={handleLinkClick}>
                  Completed
                </Link>
              </li>
              <li className={`${activeTab === '/loan/not-interested' && 'active'}`}>
                <Link to="/loan/not-interested" onClick={handleLinkClick}>
                  Not Interested
                </Link>
              </li>
              <li className={`${activeTab === '/loan/configuration' && 'active'}`}>
                <Link to="/loan/configuration" onClick={handleLinkClick}>
                  Configuration
                </Link>
              </li>
            </ul>
          </li>
        )}

        {((user && user.role_id === ROLE_IDS.SUPER_ADMIN) || (categoryId && categoryId.includes(CATEGORY_IDS.MEDICLAIM))) && (
          <li>
            <div
              className={`submenu-toggle ${openSubmenus['mediclaim'] ? 'open' : ''}`}
              onClick={() => toggleSubmenu('mediclaim')}
            >
              <i className="bi bi-heart-pulse"></i>
              <span>Mediclaim</span>
              <i className={`submenu-arrow bi ${openSubmenus['mediclaim'] ? 'bi-chevron-up' : 'bi-chevron-down'}`}></i>
            </div>
            <ul className={`submenu ${openSubmenus['mediclaim'] ? 'open' : ''}`}>
              <li className={`${activeTab === '/mediclaim' && 'active'}`}>
                <Link to="/mediclaim" onClick={handleLinkClick}>
                  Mediclaim Consumer
                </Link>
              </li>
              <li className={`${activeTab === '/mediclaim/all-policies' && 'active'}`}>
                <Link to="/mediclaim/all-policies" onClick={handleLinkClick}>
                  All Policies
                </Link>
              </li>
              <li className={`${activeTab === '/mediclaim/renewal' && 'active'}`}>
                <Link to="/mediclaim/renewal" onClick={handleLinkClick}>
                  Renewal Sheet
                </Link>
              </li>
              <li className={`${activeTab === '/mediclaim/company' && 'active'}`}>
                <Link to="/mediclaim/company" onClick={handleLinkClick}>
                  Mediclaim Company
                </Link>
              </li>
            </ul>
          </li>
        )}

        {((user && user.role_id === ROLE_IDS.SUPER_ADMIN) || (categoryId && categoryId.includes(CATEGORY_IDS.VEHICLE))) && (
          <li>
            <div
              className={`submenu-toggle ${openSubmenus['vehicle'] ? 'open' : ''}`}
              onClick={() => toggleSubmenu('vehicle')}
            >
              <i className="bi bi-car-front"></i>
              <span>Vehicle</span>
              <i className={`submenu-arrow bi ${openSubmenus['vehicle'] ? 'bi-chevron-up' : 'bi-chevron-down'}`}></i>
            </div>
            <ul className={`submenu ${openSubmenus['vehicle'] ? 'open' : ''}`}>
              <li className={`${activeTab === '/vehicle-insurance' && 'active'}`}>
                <Link to="/vehicle-insurance" onClick={handleLinkClick}>
                  Vehicle Consumer
                </Link>
              </li>
              <li className={`${activeTab === '/vehicle-insurance/renewal' && 'active'}`}>
                <Link to="/vehicle-insurance/renewal" onClick={handleLinkClick}>
                  Renewal Sheet
                </Link>
              </li>
            </ul>
          </li>
        )}

        {((user && user.role_id === ROLE_IDS.SUPER_ADMIN) || (categoryId && categoryId.includes(CATEGORY_IDS.LIFE_INSURANCE))) && (
          <li>
            <div
              className={`submenu-toggle ${openSubmenus['lifeinsurance'] ? 'open' : ''}`}
              onClick={() => toggleSubmenu('lifeinsurance')}
            >
              <i className="bi bi-heart-pulse"></i>
              <span>Life Insurance</span>
              <i className={`submenu-arrow bi ${openSubmenus['lifeinsurance'] ? 'bi-chevron-up' : 'bi-chevron-down'}`}></i>
            </div>
            <ul className={`submenu ${openSubmenus['lifeinsurance'] ? 'open' : ''}`}>
              <li className={`${activeTab === '/lifeinsurance' && 'active'}`}>
                <Link to="/lifeinsurance" onClick={handleLinkClick}>
                  <i className="bi bi-person-heart"></i>
                  Life Insurance Consumer
                </Link>
              </li>
              <li className={`${activeTab === '/lifeinsurance/renewal' && 'active'}`}>
                <Link to="/lifeinsurance/renewal" onClick={handleLinkClick}>
                  <i className="bi bi-arrow-clockwise"></i>
                  Renewal Sheet
                </Link>
              </li>
            </ul>
          </li>
        )}

        {((user && user.role_id === ROLE_IDS.SUPER_ADMIN) || (categoryId && categoryId.includes(CATEGORY_IDS.MEDICLAIM))) && (
          <li className={`${activeTab === '/inquiries' && 'active'}`}>
            <Link to="/inquiries" onClick={handleLinkClick}>
              <i className="bi bi-question-circle"></i>
              <span>Inquiries</span>
            </Link>
          </li>
        )}

        {user && user.role_id === ROLE_IDS.SUPER_ADMIN && (
          <li className={`${activeTab === '/dashboard/blog' && 'active'}`}>
            <Link to="/dashboard/blog" onClick={handleLinkClick}>
              <i className="bi bi-pencil-square"></i>
              <span>Blog</span>
            </Link>
          </li>
        )}

        {user && user.role_id === ROLE_IDS.SUPER_ADMIN && (
          <li className={`${activeTab === '/user' && 'active'}`}>
            <Link to="/user" onClick={handleLinkClick}>
              <i className="bi bi-person-lines-fill"></i>
              <span>Role Manager</span>
            </Link>
          </li>
        )}
      </ul>

      {/*<div className="sidebar-footer">
        <button className="logout-btn" onClick={handleLogout}>
          <i className="bi bi-box-arrow-right"></i>
          Logout
        </button>
        <button className="toggle-btn" onClick={toggleSidebar}>
          <i className="bi bi-arrow-bar-left"></i>
        </button>
      </div>*/}
    </div>
  );
};

export default Sidebar;
