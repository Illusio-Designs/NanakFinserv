import { ROLE_IDS, CATEGORY_IDS } from "../config/ids";
import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/components/DashboardSidebar.css';
import Cookies from 'js-cookie';
import { getVerticalSettings } from '../serviceAPI/adminApi';
import {
  FaHome,
  FaUsers, 
  FaBuilding, 
  FaHandHoldingUsd, 
  FaShieldAlt, 
  FaCar, 
  FaQuestionCircle, 
  FaBlog, 
  FaUserCog,
  FaChevronDown,
  FaChevronUp,
  FaUserTie,
  FaBuilding as FaBuildingIcon,
  FaHeart,
  FaCheckCircle,
  FaTimesCircle,
  FaCog,
  FaUserMd,
  FaFileAlt,
  FaHospital,
  FaCarSide,
  FaFileContract,
  FaHeartbeat,
  FaUser,
  FaRedo
} from 'react-icons/fa';

const DashboardSidebar = ({ isOpen, toggleSidebar }) => {
  const [activeTab, setActiveTab] = useState('');
  const [openSubmenus, setOpenSubmenus] = useState(() => {
    const storedState = localStorage.getItem('openSubmenus');
    return storedState ? JSON.parse(storedState) : {};
  });
  // Global vertical toggles (admin Settings). Default all on so nothing hides
  // before the settings load.
  const [verticals, setVerticals] = useState({
    loan: true, vehicle: true, mediclaim: true, life: true,
  });

  const location = useLocation();

  useEffect(() => {
    (async () => {
      const res = await getVerticalSettings();
      if (res && res.verticals) setVerticals(res.verticals);
    })();
  }, []);

  useEffect(() => {
    setActiveTab(location.pathname);
    let activePath = location.pathname.split('/')[1];
    
    // Handle vehicle-insurance and vehicle-policies paths
    if (activePath === 'vehicle-insurance' || activePath === 'vehicle-policies') {
      activePath = 'vehicle';
    }
    
    if (activePath) {
      // Only open the submenu for the current active path, close all others
      setOpenSubmenus({
        [activePath]: true,
      });
    }
  }, [location.pathname]);

  // Safely parse cookies with error handling
  let categoryId = [];
  let user = {};
  
  try {
    const categoryCookie = Cookies.get('category');
    if (categoryCookie) {
      // Accept JSON array ("[1,2,4]") OR CSV string ("1,2,4")
      if (categoryCookie.trim().startsWith('[')) {
        categoryId = JSON.parse(categoryCookie);
      } else {
        categoryId = categoryCookie
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
          .map((n) => Number(n))
          .filter((n) => !Number.isNaN(n));
      }
    }
  } catch (error) {
    console.error('🔍 [SIDEBAR] Error parsing category cookie:', error);
    console.error('🔍 [SIDEBAR] Raw category cookie that failed:', Cookies.get('category'));
    categoryId = [];
  }
  
  try {
    const userCookie = Cookies.get('user');
    if (userCookie) {
      user = JSON.parse(userCookie);
    }
  } catch (error) {
    console.error('🔍 [SIDEBAR] Error parsing user cookie:', error);
    user = {};
  }
  
  // Check if user is Super Admin via role OR category includes 1
  const isSuperAdmin = (user && user.role_id === ROLE_IDS.SUPER_ADMIN) || (Array.isArray(categoryId) && categoryId.includes(ROLE_IDS.SUPER_ADMIN));

  const handleLinkClick = () => {
    toggleSidebar();
  };

  const toggleSubmenu = (submenuKey) => {
    // If the clicked submenu is already open, close it
    // Otherwise, close all submenus and open only the clicked one
    const isCurrentlyOpen = openSubmenus[submenuKey];
    const updatedSubmenus = isCurrentlyOpen
      ? {} // Close all submenus including the current one
      : { [submenuKey]: true }; // Close all others and open only the clicked one
    
    setOpenSubmenus(updatedSubmenus);
    localStorage.setItem('openSubmenus', JSON.stringify(updatedSubmenus));
  };

  return (
    <aside className={`dashboard-sidebar ${!isOpen ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <img 
            src={isOpen ? "/Assets/logo.png" : "/Assets/cropped-logo.png"} 
            alt="Nanak Finserv" 
            className="logo-image"
          />
        </div>
      </div>
      
    <nav className="sidebar-nav">
        <ul className="nav-list">
          {user && user.role_id !== ROLE_IDS.BUILDER && (
            <li className={`nav-item ${activeTab === '/dashboard' ? 'active' : ''}`}>
              <Link to="/dashboard" onClick={handleLinkClick} className="nav-link">
                <FaHome className="nav-icon" />
                <span className="nav-text">Dashboard</span>
              </Link>
            </li>
          )}

          {(isSuperAdmin || (user && user.role_id === ROLE_IDS.BUILDER)) && (
            <li className={`nav-item ${activeTab === '/consumer' ? 'active' : ''}`}>
              <Link to="/consumer" onClick={handleLinkClick} className="nav-link">
                <FaUsers className="nav-icon" />
                <span className="nav-text">Consumer</span>
              </Link>
            </li>
          )}

          {/* Building Manager Menu */}
          {user && user.role_id === ROLE_IDS.BUILDING_MANAGER && (
            <li className="nav-item submenu-item">
              <div
                className={`submenu-toggle ${openSubmenus['building-manager'] ? 'open' : ''}`}
                onClick={() => toggleSubmenu('building-manager')}
              >
                <FaBuilding className="nav-icon" />
                <span className="nav-text">Building Management</span>
                {openSubmenus['building-manager'] ? (
                  <FaChevronUp className="submenu-arrow" />
                ) : (
                  <FaChevronDown className="submenu-arrow" />
                )}
              </div>
              <ul className={`submenu ${openSubmenus['building-manager'] ? 'open' : ''}`}>
                <li className={`submenu-item ${activeTab === '/builder/building' ? 'active' : ''}`}>
                  <Link to="/builder/building" onClick={handleLinkClick} className="submenu-link">
                    <FaBuildingIcon className="submenu-icon" />
                    <span>My Buildings</span>
                  </Link>
                </li>
                <li className={`submenu-item ${activeTab === '/consumer' ? 'active' : ''}`}>
                  <Link to="/consumer" onClick={handleLinkClick} className="submenu-link">
                    <FaUsers className="submenu-icon" />
                    <span>Residents</span>
                  </Link>
                </li>
              </ul>
            </li>
          )}

          {(isSuperAdmin || (user && user.role_id === ROLE_IDS.BUILDER)) && (
            <li className="nav-item submenu-item">
              <div
                className={`submenu-toggle ${openSubmenus['builder'] ? 'open' : ''}`}
                onClick={() => toggleSubmenu('builder')}
              >
                <FaBuilding className="nav-icon" />
                <span className="nav-text">Builder</span>
                {openSubmenus['builder'] ? (
                  <FaChevronUp className="submenu-arrow" />
                ) : (
                  <FaChevronDown className="submenu-arrow" />
                )}
              </div>
              <ul className={`submenu ${openSubmenus['builder'] ? 'open' : ''}`}>
                <li className={`submenu-item ${activeTab === '/builder' ? 'active' : ''}`}>
                  <Link to="/builder" onClick={handleLinkClick} className="submenu-link">
                    <FaUserTie className="submenu-icon" />
                    <span>Builder</span>
                  </Link>
                </li>
                <li className={`submenu-item ${(activeTab === '/builder/building' || location.pathname.startsWith('/unit/')) ? 'active' : ''}`}>
                  <Link to="/builder/building" onClick={handleLinkClick} className="submenu-link">
                    <FaBuildingIcon className="submenu-icon" />
                    <span>Building</span>
                  </Link>
                </li>
              </ul>
            </li>
          )}

          {(isSuperAdmin || (categoryId && categoryId.includes(CATEGORY_IDS.LOAN))) && verticals.loan && (
            <li className="nav-item submenu-item">
              <div
                className={`submenu-toggle ${openSubmenus['loan'] ? 'open' : ''}`}
                onClick={() => toggleSubmenu('loan')}
              >
                <FaHandHoldingUsd className="nav-icon" />
                <span className="nav-text">Loan</span>
                {openSubmenus['loan'] ? (
                  <FaChevronUp className="submenu-arrow" />
                ) : (
                  <FaChevronDown className="submenu-arrow" />
                )}
              </div>
              <ul className={`submenu ${openSubmenus['loan'] ? 'open' : ''}`}>
                <li className={`submenu-item ${activeTab === '/loan' ? 'active' : ''}`}>
                  <Link to="/loan" onClick={handleLinkClick} className="submenu-link">
                    <FaUsers className="submenu-icon" />
                    <span>Consumer</span>
                  </Link>
                </li>
                <li className={`submenu-item ${activeTab === '/loan/interested' ? 'active' : ''}`}>
                  <Link to="/loan/interested" onClick={handleLinkClick} className="submenu-link">
                    <FaHeart className="submenu-icon" />
                    <span>Interested</span>
                  </Link>
                </li>
                <li className={`submenu-item ${activeTab === '/loan/completed' ? 'active' : ''}`}>
                  <Link to="/loan/completed" onClick={handleLinkClick} className="submenu-link">
                    <FaCheckCircle className="submenu-icon" />
                    <span>Completed</span>
                  </Link>
                </li>
                <li className={`submenu-item ${activeTab === '/loan/not-interested' ? 'active' : ''}`}>
                  <Link to="/loan/not-interested" onClick={handleLinkClick} className="submenu-link">
                    <FaTimesCircle className="submenu-icon" />
                    <span>Not Interested</span>
                  </Link>
                </li>
                <li className={`submenu-item ${activeTab === '/loan/cancelled' ? 'active' : ''}`}>
                  <Link to="/loan/cancelled" onClick={handleLinkClick} className="submenu-link">
                    <FaRedo className="submenu-icon" />
                    <span>Cancelled</span>
                  </Link>
                </li>
                <li className={`submenu-item ${activeTab === '/loan/configuration' ? 'active' : ''}`}>
                  <Link to="/loan/configuration" onClick={handleLinkClick} className="submenu-link">
                    <FaCog className="submenu-icon" />
                    <span>Configuration</span>
                  </Link>
                </li>
              </ul>
            </li>
          )}

          {(isSuperAdmin || (categoryId && categoryId.includes(CATEGORY_IDS.MEDICLAIM))) && verticals.mediclaim && (
            <li className="nav-item submenu-item">
              <div
                className={`submenu-toggle ${openSubmenus['mediclaim'] ? 'open' : ''}`}
                onClick={() => toggleSubmenu('mediclaim')}
              >
                <FaShieldAlt className="nav-icon" />
                <span className="nav-text">Mediclaim</span>
                {openSubmenus['mediclaim'] ? (
                  <FaChevronUp className="submenu-arrow" />
                ) : (
                  <FaChevronDown className="submenu-arrow" />
                )}
              </div>
              <ul className={`submenu ${openSubmenus['mediclaim'] ? 'open' : ''}`}>
                <li className={`submenu-item ${activeTab === '/mediclaim' ? 'active' : ''}`}>
                  <Link to="/mediclaim" onClick={handleLinkClick} className="submenu-link">
                    <FaUserMd className="submenu-icon" />
                    <span>Mediclaim Consumer</span>
                  </Link>
                </li>
                <li className={`submenu-item ${activeTab === '/mediclaim/all-policies' ? 'active' : ''}`}>
                  <Link to="/mediclaim/all-policies" onClick={handleLinkClick} className="submenu-link">
                    <FaFileContract className="submenu-icon" />
                    <span>All Policies</span>
                  </Link>
                </li>
                <li className={`submenu-item ${activeTab === '/mediclaim/renewal' ? 'active' : ''}`}>
                  <Link to="/mediclaim/renewal" onClick={handleLinkClick} className="submenu-link">
                    <FaFileAlt className="submenu-icon" />
                    <span>Renewal Sheet</span>
                  </Link>
                </li>
                <li className={`submenu-item ${activeTab === '/mediclaim/company' ? 'active' : ''}`}>
                  <Link to="/mediclaim/company" onClick={handleLinkClick} className="submenu-link">
                    <FaHospital className="submenu-icon" />
                    <span>Mediclaim Company</span>
                  </Link>
                </li>
              </ul>
            </li>
          )}

          {(isSuperAdmin || (categoryId && categoryId.includes(CATEGORY_IDS.VEHICLE))) && verticals.vehicle && (
            <li className="nav-item submenu-item">
              <div
                className={`submenu-toggle ${openSubmenus['vehicle'] ? 'open' : ''}`}
                onClick={() => toggleSubmenu('vehicle')}
              >
                <FaCar className="nav-icon" />
                <span className="nav-text">Vehicle</span>
                {openSubmenus['vehicle'] ? (
                  <FaChevronUp className="submenu-arrow" />
                ) : (
                  <FaChevronDown className="submenu-arrow" />
                )}
              </div>
              <ul className={`submenu ${openSubmenus['vehicle'] ? 'open' : ''}`}>
                <li className={`submenu-item ${activeTab === '/vehicle-insurance' ? 'active' : ''}`}>
                  <Link to="/vehicle-insurance" onClick={handleLinkClick} className="submenu-link">
                    <FaCarSide className="submenu-icon" />
                    <span>Vehicle Consumer</span>
                  </Link>
                </li>
                <li className={`submenu-item ${activeTab === '/vehicle-insurance/renewal' ? 'active' : ''}`}>
                  <Link to="/vehicle-insurance/renewal" onClick={handleLinkClick} className="submenu-link">
                    <FaFileContract className="submenu-icon" />
                    <span>Renewal Sheet</span>
                  </Link>
                </li>
                <li className={`submenu-item ${activeTab === '/vehicle-policies' ? 'active' : ''}`}>
                  <Link to="/vehicle-policies" onClick={handleLinkClick} className="submenu-link">
                    <FaFileAlt className="submenu-icon" />
                    <span>All Policies</span>
                  </Link>
                </li>
              </ul>
            </li>
          )}

          {(isSuperAdmin || (categoryId && categoryId.includes(CATEGORY_IDS.LIFE_INSURANCE))) && verticals.life && (
            <li className="nav-item submenu-item">
              <div
                className={`submenu-toggle ${openSubmenus['lifeinsurance'] ? 'open' : ''}`}
                onClick={() => toggleSubmenu('lifeinsurance')}
              >
                <FaHeartbeat className="nav-icon" />
                <span className="nav-text">Life Insurance</span>
                {openSubmenus['lifeinsurance'] ? (
                  <FaChevronUp className="submenu-arrow" />
                ) : (
                  <FaChevronDown className="submenu-arrow" />
                )}
              </div>
              <ul className={`submenu ${openSubmenus['lifeinsurance'] ? 'open' : ''}`}>
                <li className={`submenu-item ${activeTab === '/lifeinsurance' ? 'active' : ''}`}>
                  <Link to="/lifeinsurance" onClick={handleLinkClick} className="submenu-link">
                    <FaUser className="submenu-icon" />
                    <span>Life Insurance Consumer</span>
                  </Link>
                </li>
                <li className={`submenu-item ${activeTab === '/lifeinsurance/renewal' ? 'active' : ''}`}>
                  <Link to="/lifeinsurance/renewal" onClick={handleLinkClick} className="submenu-link">
                    <FaRedo className="submenu-icon" />
                    <span>Renewal Sheet</span>
                  </Link>
                </li>
              </ul>
            </li>
          )}

          {(isSuperAdmin || (categoryId && categoryId.includes(CATEGORY_IDS.MEDICLAIM))) && verticals.mediclaim && (
            <li className={`nav-item ${activeTab === '/inquiries' ? 'active' : ''}`}>
              <Link to="/inquiries" onClick={handleLinkClick} className="nav-link">
                <FaQuestionCircle className="nav-icon" />
                <span className="nav-text">Inquiries</span>
              </Link>
            </li>
          )}

          {isSuperAdmin && (
            <li className={`nav-item ${activeTab === '/dashboard/blog' ? 'active' : ''}`}>
              <Link to="/dashboard/blog" onClick={handleLinkClick} className="nav-link">
                <FaBlog className="nav-icon" />
                <span className="nav-text">Blog</span>
              </Link>
            </li>
          )}

          {isSuperAdmin && (
            <li className={`nav-item ${activeTab === '/user' ? 'active' : ''}`}>
              <Link to="/user" onClick={handleLinkClick} className="nav-link">
                <FaUserCog className="nav-icon" />
                <span className="nav-text">Role Manager</span>
              </Link>
            </li>
          )}

          {isSuperAdmin && (
            <li className={`nav-item ${activeTab === '/settings' ? 'active' : ''}`}>
              <Link to="/settings" onClick={handleLinkClick} className="nav-link">
                <FaCog className="nav-icon" />
                <span className="nav-text">Settings</span>
              </Link>
            </li>
          )}
      </ul>
    </nav>
  </aside>
);
};

export default DashboardSidebar; 