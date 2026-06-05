import React, { useEffect, useState, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate, Navigate, Outlet, BrowserRouter } from 'react-router-dom';
import CustomScrollbar from './CustomScrollbar';
import Popup from './components/popup';
import Cookies from 'js-cookie';
import { ToasterProvider } from './components/Toaster';
import { Toaster } from 'react-hot-toast';
import ErrorBoundary from './components/ErrorBoundary';

// Route components are lazy-loaded so each page is its own chunk (keeps the
// initial bundle small instead of shipping every dashboard page up front).
const HomePage = lazy(() => import('./pages/HomePage'));
const Services = lazy(() => import('./pages/Services'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const Blog = lazy(() => import('./pages/Blog'));
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/dashboard/Dashboard'));
const LifeInsurance = lazy(() => import('./pages/dashboard/LifeInsurance'));
const LifeInsuranceRenewalSheet = lazy(() => import('./pages/dashboard/LifeInsuranceRenewalSheet'));
const VehicleInsurance = lazy(() => import('./pages/dashboard/VehicleInsurance'));
const VehiclePolicies = lazy(() => import('./pages/dashboard/VehiclePolicies'));
const Mediclaim = lazy(() => import('./pages/dashboard/Mediclaim'));
const MediclaimAllPolicies = lazy(() => import('./pages/dashboard/MediclaimAllPolicies'));
const Loan = lazy(() => import('./pages/dashboard/Loan'));
const LoanI = lazy(() => import('./pages/dashboard/Loaninterested'));
const LoanNI = lazy(() => import('./pages/dashboard/Loanni'));
const LoanCancelled = lazy(() => import('./pages/dashboard/Loancancelled'));
const Consumer = lazy(() => import('./pages/dashboard/Consumer'));
const Builder = lazy(() => import('./pages/dashboard/Builder'));
const Unit = lazy(() => import('./pages/dashboard/Unit'));
const User = lazy(() => import('./pages/dashboard/User'));
const Building = lazy(() => import('./pages/dashboard/Building'));
const Loandisbuss = lazy(() => import('./pages/dashboard/Loandisbuss'));
const MediclaimCompany = lazy(() => import('./pages/dashboard/MediclaimCompany'));
const MediclaimProduct = lazy(() => import('./pages/dashboard/MedicliamProduct'));
const LoanConfiguration = lazy(() => import('./pages/dashboard/LoanConfiguration'));
const RenewalSheet = lazy(() => import('./pages/dashboard/RenewalSheet'));
const Inquiries = lazy(() => import('./pages/dashboard/Inquiries'));
const BlogDashboard = lazy(() => import('./pages/dashboard/Blog'));
const VehicleRenewalSheet = lazy(() => import('./pages/dashboard/VehicleRenewalSheet'));
const Support = lazy(() => import('./pages/dashboard/Support'));
const BlogDetail = lazy(() => import('./pages/BlogDetail'));
const WidgetDemo = lazy(() => import('./pages/WidgetDemo'));

const directories = [
  { "Dashboard": [] },
  { "Loan": [] },
  { "LifeInsurance": [] },
  { "Mediclaim": [] },
  { "VehicleInsurance": [] },
  { "Consumer": [] },
  { "Builder": [] },
  { "User": [] },
  { "Login": [] }
];

const AppContent = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [category, setCategory] = useState([]);
  const [userData, setUserData] = useState(null);

  // Helper function to safely parse cookies
  const safeParseCookie = (cookieName, defaultValue = null) => {
    try {
      const cookieValue = Cookies.get(cookieName);
      if (cookieValue) {
        return JSON.parse(cookieValue);
      }
      return defaultValue;
    } catch (error) {
      console.error(`🔍 [APP] Error parsing ${cookieName} cookie:`, error);
      return defaultValue;
    }
  };

  // Helper function to parse category cookie (supports both JSON array and CSV string)
  const parseCategoryCookie = () => {
    try {
      const categoryCookie = Cookies.get('category');
      if (!categoryCookie) return [];
      
      // Accept JSON array ("[1,2,4]") OR CSV string ("1,2,4")
      if (categoryCookie.trim().startsWith('[')) {
        return JSON.parse(categoryCookie);
      } else {
        return categoryCookie
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
          .map((n) => Number(n))
          .filter((n) => !Number.isNaN(n));
      }
    } catch (error) {
      console.error('🔍 [APP] Error parsing category cookie:', error);
      return [];
    }
  };

  // Helper function to check if user is Super Admin
  const isSuperAdmin = () => {
    const user = safeParseCookie('user', {});
    const categoryId = parseCategoryCookie();
    return (user && user.role_id === 1) || (Array.isArray(categoryId) && categoryId.includes(1));
  };

  const dashboardPaths = [
    '/dashboard',
    '/dashboard/support',
    '/lifeinsurance',
    '/vehicle-insurance',
    '/vehicle-insurance/renewal',
    '/vehicle-insurance/consumer',
    '/vehicle-policies',
    '/mediclaim',
    '/mediclaim/company',
    '/mediclaim/renewal',
    '/loan',
    '/loan/interested',
    '/loan/not-interested',
    '/loan/cancelled',
    '/loan/configuration',
    '/loan/disburse',
    '/loan/completed',
    '/consumer',
    '/builder',
    '/unit',
    '/user',
    '/inquiries',
    '/blog'
  ];

  const pagesPaths = [
    '/',
    '/services',
    '/about',
    '/login',
    '/contact',
    '/blog',
  ];

  useEffect(() => {
    try {
      const userCookie = Cookies.get('user');
      const user = userCookie ? JSON.parse(userCookie) : null;
      setUserData(user);
      if (user && user.category && Array.isArray(user.category)) {
        let data = user.category.map((item) => item['category.category_id']);
        setCategory(data);
      }
    } catch (error) {
      console.error("Error parsing user cookie:", error);
      setUserData(null);
    }
  }, []);


  const PrivateRoutes = () => {
    const token = Cookies.get('token');
    return token ? <Outlet /> : <Navigate to='/login' />;
  };

  const PrivateDashboard = ({ element }) => {
    const user = Cookies.get('user') && JSON.parse(Cookies.get('user'));
    const categoryId = Cookies.get('category');
    return user && user.role_id != 2 ? element : user ? <Navigate to="/consumer" /> : <Navigate to="/login" />;
  };

  const PrivateLoan = ({ element }) => {
    const user = safeParseCookie('user', {});
    const categoryId = parseCategoryCookie();
    const superAdmin = isSuperAdmin();
    return (superAdmin || (categoryId && categoryId.includes(2))) ? element : <Navigate to="/dashboard" />;
  };

  const PrivateMediclaim = ({ element }) => {
    const user = safeParseCookie('user', {});
    const categoryId = parseCategoryCookie();
    const superAdmin = isSuperAdmin();
    return (superAdmin || (categoryId && categoryId.includes(4))) ? element : <Navigate to="/dashboard" />;
  };

  const PrivateInquiries = ({ element }) => {
    const user = safeParseCookie('user', {});
    const categoryId = parseCategoryCookie();
    const superAdmin = isSuperAdmin();
    return (superAdmin || (categoryId && categoryId.includes(4))) ? element : <Navigate to="/dashboard" />;
  };

  const PrivateLife = ({ element }) => {
    const user = safeParseCookie('user', {});
    const categoryId = parseCategoryCookie();
    const superAdmin = isSuperAdmin();
    return (superAdmin || (categoryId && categoryId.includes(5))) ? element : <Navigate to="/dashboard" />;
  };

  const PrivateVehicle = ({ element }) => {
    const user = safeParseCookie('user', {});
    const categoryId = parseCategoryCookie();
    const superAdmin = isSuperAdmin();
    return (superAdmin || (categoryId && categoryId.includes(6))) ? element : <Navigate to="/dashboard" />;
  };

  const PrivateBuilder = ({ element }) => {
    const user = safeParseCookie('user', {});
    const superAdmin = isSuperAdmin();
    return (superAdmin || (user && user.role_id === 2)) ? element : <Navigate to="/dashboard" />;
  };

  const PrivateBuildingManager = ({ element }) => {
    const user = safeParseCookie('user', {});
    const superAdmin = isSuperAdmin();
    return (superAdmin || (user && (user.role_id === 2 || user.role_id === 7))) ? element : <Navigate to="/dashboard" />;
  };

  const PrivateConsumer = ({ element }) => {
    const user = safeParseCookie('user', {});
    const superAdmin = isSuperAdmin();
    return (superAdmin || (user && (user.role_id === 2 || user.role_id === 7))) ? element : <Navigate to="/dashboard" />;
  };

  const PrivateRoleUser = ({ element }) => {
    const user = safeParseCookie('user', {});
    const superAdmin = isSuperAdmin();
    return superAdmin ? element : <Navigate to="/dashboard" />;
  };

  const PrivateBlog = ({ element }) => {
    const user = safeParseCookie('user', {});
    const superAdmin = isSuperAdmin();
    return superAdmin ? element : <Navigate to="/dashboard" />;
  };

  const shouldHideNavbarAndScrollbar = location.pathname.includes('builder') || location.pathname.includes('unit') || location.pathname.includes('mediclaim') ? true : dashboardPaths.includes(location.pathname);

  const isUserLoggedIn = () => {
    const user = safeParseCookie('user', {});
    return !!user;
  };

  const PrivateRoute = ({ element }) => {
    const user = isUserLoggedIn();
    return user ? element : <Navigate to="/login" />;
  };

  return (
    <ToasterProvider>
      <Toaster position="top-right" reverseOrder={false} />
      <div className="App">
        {/* Remove global Navbar rendering here */}
        <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading…</div>}>
        <Routes>
          <Route exact path="/login" element={<Login />} />
          <Route path="/" element={<HomePage />} />
          <Route path="/services" element={<Services />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:id" element={<BlogDetail />} />
          <Route path="/dashboard" element={<PrivateDashboard element={<Dashboard />} />} />
          <Route path="/dashboard/support" element={<PrivateDashboard element={<Support />} />} />
          <Route path="/consumer" element={<PrivateConsumer element={<Consumer />} />} />
          <Route path="/builder" element={<PrivateBuilder element={<Builder />} />} />
          <Route path="/unit/:id" element={<PrivateBuildingManager element={<Unit />} />} />
          <Route path="/builder/building" element={<PrivateBuildingManager element={<Building />} />} />
          {/* <Route path="/data" element={<PrivateRoute element={<DataComponent />} />} /> */}
          <Route path="/user" element={<PrivateRoute element={<User />} />} />
          <Route path="/loan" element={<PrivateLoan element={<Loan />} />} />
          <Route path="/loan/interested" element={<PrivateLoan element={<LoanI />} />} />
          <Route path="/loan/not-interested" element={<PrivateLoan element={<LoanNI />} />} />
          <Route path="/loan/cancelled" element={<PrivateLoan element={<LoanCancelled />} />} />
          <Route path="/loan/configuration" element={<PrivateLoan element={<LoanConfiguration />} />} />
          <Route path="/loan/completed" element={<PrivateLoan element={<Loandisbuss />} />} />
          <Route path="/mediclaim" element={<PrivateMediclaim element={<Mediclaim />} />} />
          <Route path="/mediclaim/all-policies" element={<PrivateMediclaim element={<MediclaimAllPolicies />} />} />
          <Route path="/mediclaim/company" element={<PrivateMediclaim element={<MediclaimCompany />} />} />
          <Route path="/mediclaim/renewal" element={<PrivateMediclaim element={<RenewalSheet />} />} />
          <Route path="/mediclaim/company/:id" element={<PrivateMediclaim element={<MediclaimProduct />} />} />
          <Route path="/inquiries" element={<PrivateInquiries element={<Inquiries />} />} />
          <Route path="/lifeinsurance" element={<PrivateLife element={<LifeInsurance />} />} />
          <Route path="/lifeinsurance/renewal" element={<PrivateLife element={<LifeInsuranceRenewalSheet />} />} />
          <Route path="/vehicle-insurance" element={<PrivateVehicle element={<VehicleInsurance />} />} />
          <Route path="/vehicle-insurance/renewal" element={<PrivateVehicle element={<VehicleRenewalSheet />} />} />
          <Route path="/vehicle-policies" element={<PrivateVehicle element={<VehiclePolicies />} />} />
          <Route path="/dashboard/blog" element={<PrivateBlog element={<BlogDashboard />} />} />
          <Route path="/widgets" element={<WidgetDemo />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        </Suspense>
        <Popup isOpen={location.pathname === ''} onClose={() => { }} />
        <CustomScrollbar />
      </div>
    </ToasterProvider>
  );
};

const App = () => {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;
