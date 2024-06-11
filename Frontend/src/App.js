import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import Services from './pages/Services';
import About from './pages/About';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Dashboard from './dashboard/Dashboard';
import LifeInsurance from './dashboard/LifeInsurance';
import VehicleInsurance from './dashboard/VehicleInsurance';
import Mediclaim from './dashboard/Mediclaim';
import LMS from './dashboard/LMS';
import Loan from './dashboard/Loan';
import Consumer from './dashboard/Consumer';
import Builder from './dashboard/Builder';
import Scrollbar from './components/Scrollbar';
import CustomScrollbar from './CustomScrollbar';
import Popup from './components/popup';
import Sidebar from './components/Sidebar';
import DataComponent from './components/DataComponent';
import User from './dashboard/User';




const directories = [
  { "Dashboard": [] },
  { "LMS": [] },
  { "Loan": [] },
  { "LifeInsurance": [] },
  { "Mediclaim": [] },
  { "VehicleInsurance": [] },
  { "Consumer": [] },
  { "Builder": [] },
  { "User": [] }
];

const AppContent = () => {
  const location = useLocation();

  // Define the paths where the Navbar and Scrollbar should be hidden
  const dashboardPaths = [
    '/dashboard',
    '/lifeinsurance',
    '/vehicleinsurance',
    '/mediclaim',
    '/lms',
    '/loan',
    '/consumer',
    '/builder',
    '/user'
  ];

  // Define the paths where the Sidebar should be hidden
  const pagesPaths = [
    '/',
    '/services',
    '/about',
    '/login',
    '/contact'
  ];

  const shouldHideNavbarAndScrollbar = dashboardPaths.includes(location.pathname);
  const shouldHideSidebar = pagesPaths.includes(location.pathname);

  return (
    <div className="App">
      {!shouldHideNavbarAndScrollbar && <Scrollbar />}
      {!shouldHideNavbarAndScrollbar && <Navbar />}
      {!shouldHideSidebar && <Sidebar directories={directories} />}
      <div className="content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/services" element={<Services />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/lifeinsurance" element={<LifeInsurance />} />
          <Route path="/vehicleinsurance" element={<VehicleInsurance />} />
          <Route path="/mediclaim" element={<Mediclaim />} />
          <Route path="/lms" element={<LMS />} />
          <Route path="/loan" element={<Loan />} />
          <Route path="/consumer" element={<Consumer />} />
          <Route path="/builder" element={<Builder />} />
          <Route path="/data" element={<DataComponent />} />
          <Route path="/user" element={<User />} />
        </Routes>
        <Popup isOpen={location.pathname === ''} onClose={() => {}} />
        <CustomScrollbar />
      </div>
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;