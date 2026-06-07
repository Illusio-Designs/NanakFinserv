import { ROLE_IDS, CATEGORY_IDS } from "../../config/ids";
import React, { useEffect, useState } from 'react';
import '../../styles/pages/dashboard/Consumer.css';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import DashboardLayout from '../../components/DashboardLayout';
import { getAllConsumers, getAllVerticle, getAllVerticleUser, addConsumerUser, updateConsumerUser, getAllBuilders, getUserCountList, getHousehold, addFamilyMember } from '../../serviceAPI/userAPI';
import toast from 'react-hot-toast';
import Cookies from 'js-cookie';

const Consumer = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [verticle, setVerticle] = useState([]);
  const [verticleUser, setVerticleUser] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [heading, setHeading] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [roleData, setRoleData] = useState({});
  const [builderData, setBuilderData] = useState([]);
  const [formData, setFormData] = useState({
    username: '',
    phone_number: '',
    email: '',
    referenceName: '',
    builderType: ''
  });
  const [selectedCategories, setSelectedCategories] = useState({
    loan: { checked: false, roleId: '' },
    mediclaim: { checked: false, roleId: '' },
    lifeInsurance: { checked: false, roleId: '' },
    vehicleInsurance: { checked: false, roleId: '' }
  });
  const [loading, setLoading] = useState(false);
  // ── Family / household ──
  const [familyOpen, setFamilyOpen] = useState(false);
  const [familyHead, setFamilyHead] = useState(null);   // the consumer row whose family we manage
  const [household, setHousehold] = useState([]);        // members + their policies
  const [familyLoading, setFamilyLoading] = useState(false);
  const [familyForm, setFamilyForm] = useState({ username: '', phone_number: '', email: '', referenceName: '' });
  const [activeFilter, setActiveFilter] = useState(null); // null, 'all', 'loan', 'mediclaim', 'vehicle', 'life', 'unassigned'
  const [statsData, setStatsData] = useState({
    totalConsumers: 0,
    loanConsumers: 0,
    mediclaimConsumers: 0,
    vehicleConsumers: 0,
    lifeConsumers: 0,
    unassignedConsumers: 0
  });
  
  const userCookie = Cookies.get('user');
  const user = userCookie ? JSON.parse(userCookie) : null;

  // Helper function to format category display
  const formatCategoryDisplay = (categories) => {
    if (!categories || categories.length === 0) {
      return <span className="no-categories">No Services</span>;
    }
    
    const categoryMap = {
      2: { name: 'Loan', color: '#FF9800', icon: '💰' },
      4: { name: 'Mediclaim', color: '#00BCD4', icon: '🏥' },
      5: { name: 'Life Insurance', color: '#9C27B0', icon: '🛡️' },
      6: { name: 'Vehicle', color: '#4CAF50', icon: '🚗' }
    };
    
    return (
      <div className="category-tags">
        {categories.map((cat, index) => {
          const categoryInfo = categoryMap[cat.category_id] || { name: 'Unknown', color: '#666', icon: '❓' };
          return (
            <span 
              key={index} 
              className="category-tag" 
              style={{ backgroundColor: categoryInfo.color }}
              title={`${categoryInfo.name} (Role ID: ${cat.user_role_id})`}
            >
              {categoryInfo.icon} {categoryInfo.name}
            </span>
          );
        })}
      </div>
    );
  };

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
    if (!isModalOpen) {
      setEditData(null);
      resetForm();
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      phone_number: '',
      email: '',
      referenceName: '',
      builderType: ''
    });
    setSelectedCategories({
      loan: { checked: false, roleId: '' },
      mediclaim: { checked: false, roleId: '' },
      lifeInsurance: { checked: false, roleId: '' },
      vehicleInsurance: { checked: false, roleId: '' }
    });
  };

  useEffect(() => {
    getConsumerData();
    getAllVerticleData();
    getAllVerticleUserData();
    getBuilderData();
    getRoleData();
    fetchStatistics();
  }, []);

  // Debug effect to see what data we have
  useEffect(() => {
    console.log('🔍 [FRONTEND] Debug useEffect - Current roleData:', roleData);
    console.log('🔍 [FRONTEND] Debug useEffect - Current verticleUser:', verticleUser);
    console.log('🔍 [FRONTEND] Debug useEffect - Current user:', user);
    console.log('🔍 [FRONTEND] Debug useEffect - User role_id:', user?.role_id);
    console.log('🔍 [FRONTEND] Debug useEffect - Should show Builder Type:', user && user.role_id === ROLE_IDS.SUPER_ADMIN);
    
    // Log specific category data
    console.log('🔍 [FRONTEND] Debug useEffect - Life Insurance (5) roleData:', roleData[5]);
    console.log('🔍 [FRONTEND] Debug useEffect - Loan (2) roleData:', roleData[2]);
    console.log('🔍 [FRONTEND] Debug useEffect - Mediclaim (4) roleData:', roleData[4]);
    console.log('🔍 [FRONTEND] Debug useEffect - Vehicle Insurance (6) roleData:', roleData[6]);
  }, [roleData, verticleUser, user]);

  // Apply filters when activeFilter or data changes
  useEffect(() => {
    let filtered = data;

    // Filter out building managers
    filtered = filtered.filter(row => {
      const roleName = row.role || '';
      return roleName.toLowerCase() !== 'building manager';
    });

    // Apply active filter
    if (activeFilter) {
      filtered = filtered.filter(item => {
        const hasCategories = item.category && item.category.length > 0;
        
        switch (activeFilter) {
          case 'all':
            return true; // Show all consumers
          case 'loan':
            return hasCategories && item.category.some(cat => cat.category_id === CATEGORY_IDS.LOAN);
          case 'mediclaim':
            return hasCategories && item.category.some(cat => cat.category_id === CATEGORY_IDS.MEDICLAIM);
          case 'life':
            return hasCategories && item.category.some(cat => cat.category_id === CATEGORY_IDS.LIFE_INSURANCE);
          case 'vehicle':
            return hasCategories && item.category.some(cat => cat.category_id === CATEGORY_IDS.VEHICLE);
          case 'unassigned':
            return !hasCategories; // No categories assigned
          default:
            return true;
        }
      });
    }

    setFilteredData(filtered);
  }, [activeFilter, data]);

  // Filter data when search query changes
  const handleSearch = (searchQuery) => {
    let filtered = data;

    // Filter out building managers
    filtered = filtered.filter(row => {
      const roleName = row.role || '';
      return roleName.toLowerCase() !== 'building manager';
    });

    // Apply search filter
    if (searchQuery && searchQuery.trim()) {
      filtered = filtered.filter(row => {
        return Object.values(row).some(value =>
          String(value || '').toLowerCase().includes(searchQuery.toLowerCase())
        );
      });
    }

    // Apply active filter
    if (activeFilter) {
      filtered = filtered.filter(item => {
        const hasCategories = item.category && item.category.length > 0;
        
        switch (activeFilter) {
          case 'all':
            return true; // Show all consumers
          case 'loan':
            return hasCategories && item.category.some(cat => cat.category_id === CATEGORY_IDS.LOAN);
          case 'mediclaim':
            return hasCategories && item.category.some(cat => cat.category_id === CATEGORY_IDS.MEDICLAIM);
          case 'life':
            return hasCategories && item.category.some(cat => cat.category_id === CATEGORY_IDS.LIFE_INSURANCE);
          case 'vehicle':
            return hasCategories && item.category.some(cat => cat.category_id === CATEGORY_IDS.VEHICLE);
          case 'unassigned':
            return !hasCategories; // No categories assigned
          default:
            return true;
        }
      });
    }

    setFilteredData(filtered);
  };

  const handleCardClick = (filterType) => {
    // Toggle filter: if same card clicked, clear filter; otherwise set new filter
    setActiveFilter(activeFilter === filterType ? null : filterType);
  };

  const getConsumerData = async () => {
    setLoading(true);
    const consumerData = await getAllConsumers();
    if (consumerData?.data && consumerData?.data?.length) {
      const mappedData = consumerData.data
        .filter(item => {
          // Filter out building managers from consumer list
          const roleName = item.roleDisplay || item.role?.role_name || item.role_id || '';
          return roleName.toLowerCase() !== 'building manager';
        })
        // .map(item => ({
        //   ...item,
        //   referenceName: item.referenceName || '-',
        //   role: item.roleDisplay || item.role?.role_name || item.role_id || 'N/A',
        //   builderUser: item.builder_user ? `Yes - ${item.builder_user}` : 'No',
        //   categories: item.category || [],
        //   categoryDisplay: formatCategoryDisplay(item.category || [])
        // }));
        .map(item => {
          // Use builder_company_name from API response if available, otherwise fall back to lookup
          let builderUserDisplay = 'No Builder';
          
          if (item.builder_company_name) {
            // Use the builder company name directly from API response
            builderUserDisplay = item.builder_company_name;
          } else if (item.builder_user) {
            // Fallback: Try to find builder by matching user_id (for backward compatibility)
            const builder = builderData.find(b => {
              const builderUserId = b.user_id || b.id;
              const consumerBuilderUserId = item.builder_user;
              // Compare both as strings and numbers to handle type mismatches
              return builderUserId == consumerBuilderUserId || 
                     String(builderUserId) === String(consumerBuilderUserId);
            });
            
            if (builder) {
              // Use username if available, otherwise try other fields
              builderUserDisplay = builder.username || builder.name || builder['builderuser.company_name'] || 'Unknown';
            } else {
              // Builder not found in builderData - might not be loaded yet
              console.warn('Builder not found for builder_user:', item.builder_user, 'Available builders:', builderData.map(b => ({ id: b.user_id || b.id, name: b.username })));
              builderUserDisplay = 'Unknown';
            }
          }

          return {
            ...item,
            referenceName: item.referenceName || '-',
            role: item.roleDisplay || item.role?.role_name || item.role_id || 'N/A',
            builderUser: builderUserDisplay,
      
            // FINAL WORKING CATEGORY OUTPUT
            categories: item.category || [],
            categoryDisplay: formatCategoryDisplay(
              (item.category || []).map(c => ({
                category_id: c.category_id,
                user_role_id: c.user_role_id
              }))
            )
          };
        });
        
      setData(mappedData);
      setFilteredData(mappedData);
    } else {
      setData([]);
      setFilteredData([]);
    }
    
    // Set table columns
    let tableColumns = [
      { key: 'username', head: 'Name' },
      { key: 'email', head: 'Email' },
      { key: 'mobileNumber', head: 'Mobile' },
      { key: 'categoryDisplay', head: 'Services' },
      { key: 'referenceName', head: 'Reference' }
    ];
    
    // Only show builder column if NOT building manager
    if (user?.role_id !== ROLE_IDS.BUILDING_MANAGER) {
      tableColumns.push({ key: 'builderUser', head: 'Builder User' });
    }
    
    setHeading(tableColumns);
    setLoading(false);
  };

  // Re-process consumer data when builderData becomes available
  useEffect(() => {
    if (data.length > 0 && builderData.length > 0) {
      // Re-map data to update builder user names now that builderData is available
      const remappedData = data.map(item => {
        // Use builder_company_name from API response if available, otherwise fall back to lookup
        let builderUserDisplay = 'No Builder';
        
        if (item.builder_company_name) {
          // Use the builder company name directly from API response
          builderUserDisplay = item.builder_company_name;
        } else if (item.builder_user) {
          // Fallback: Try to find builder by matching user_id (for backward compatibility)
          const builder = builderData.find(b => {
            const builderUserId = b.user_id || b.id;
            const consumerBuilderUserId = item.builder_user;
            // Compare both as strings and numbers to handle type mismatches
            return builderUserId == consumerBuilderUserId || 
                   String(builderUserId) === String(consumerBuilderUserId);
          });
          
          if (builder) {
            // Use username if available, otherwise try other fields
            builderUserDisplay = builder.username || builder.name || builder['builderuser.company_name'] || 'Unknown';
          } else {
            builderUserDisplay = 'Unknown';
          }
        }

        return {
          ...item,
          builderUser: builderUserDisplay
        };
      });

      // Only update if builder user display actually changed
      const hasChanges = remappedData.some((item, index) => 
        item.builderUser !== data[index]?.builderUser
      );

      if (hasChanges) {
        setData(remappedData);
        setFilteredData(remappedData);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [builderData]);
  

  const getAllVerticleData = async () => {
    const verticleData = await getAllVerticle();
    if (verticleData?.data && verticleData?.data?.length) {
      setVerticle(verticleData?.data);
    } else {
      setVerticle([]);
    }
  };

  const getAllVerticleUserData = async () => {
    try {
      // Fetch data for all categories
      const categories = [2, 4, 5, 6]; // Loan, Mediclaim, Life Insurance, Vehicle Insurance
      const allVerticleData = {};
      
      console.log('🔍 [FRONTEND] getAllVerticleUserData - Starting to fetch data for categories:', categories);
      
      for (const categoryId of categories) {
        const categoryVerticle = { category: [categoryId] };
        console.log(`🔍 [FRONTEND] getAllVerticleUserData - Fetching data for category ${categoryId} with payload:`, categoryVerticle);
        
        const verticleUserData = await getAllVerticleUser(categoryVerticle);
        console.log(`🔍 [FRONTEND] getAllVerticleUserData - Response for category ${categoryId}:`, verticleUserData);
        
        if (verticleUserData?.data && verticleUserData?.data?.length) {
          allVerticleData[categoryId] = verticleUserData.data;
          console.log(`🔍 [FRONTEND] getAllVerticleUserData - Category ${categoryId} has ${verticleUserData.data.length} users:`, verticleUserData.data);
        } else {
          allVerticleData[categoryId] = [];
          console.log(`🔍 [FRONTEND] getAllVerticleUserData - Category ${categoryId} has no users`);
        }
      }
      
      console.log('🔍 [FRONTEND] getAllVerticleUserData - Final allVerticleData:', allVerticleData);
      setVerticleUser(allVerticleData);
    } catch (error) {
      console.error('🔍 [FRONTEND] getAllVerticleUserData - Error fetching verticle user data:', error);
      setVerticleUser({});
    }
  };

  const getRoleData = async () => {
    try {
      // Fetch role data for different categories from the API
      const categories = [2, 4, 5, 6]; // Loan, Mediclaim, Life Insurance, Vehicle Insurance
      const allRoleData = {};
      
      console.log('🔍 [FRONTEND] getRoleData - Starting to fetch role data for categories:', categories);
      
      for (const categoryId of categories) {
        const categoryVerticle = { category: [categoryId] };
        console.log(`🔍 [FRONTEND] getRoleData - Fetching role data for category ${categoryId} with payload:`, categoryVerticle);
        
        const verticleUserData = await getAllVerticleUser(categoryVerticle);
        console.log(`🔍 [FRONTEND] getRoleData - Response for category ${categoryId}:`, verticleUserData);
        
        if (verticleUserData?.data && verticleUserData?.data?.length) {
          allRoleData[categoryId] = verticleUserData.data;
          console.log(`🔍 [FRONTEND] getRoleData - Category ${categoryId} has ${verticleUserData.data.length} role users:`, verticleUserData.data);
        } else {
          allRoleData[categoryId] = [];
          console.log(`🔍 [FRONTEND] getRoleData - Category ${categoryId} has no role users`);
        }
      }
      
      console.log('🔍 [FRONTEND] getRoleData - Final allRoleData:', allRoleData);
      setRoleData(allRoleData);
    } catch (error) {
      console.error('🔍 [FRONTEND] getRoleData - Error fetching role data:', error);
      setRoleData({});
    }
  };

  const fetchStatistics = async () => {
    try {
      const statsResponse = await getUserCountList();
      
      if (statsResponse?.data) {
        const totalConsumers = statsResponse.data.consumerCount || 0;
        const loanConsumers = statsResponse.data.loanUserCount || 0;
        const mediclaimConsumers = statsResponse.data.mediclaimUserCount || 0;
        const vehicleConsumers = statsResponse.data.vehicleUserCount || 0;
        const lifeConsumers = statsResponse.data.lifeUserCount || 0;
        
        // Calculate unassigned consumers properly
        const assignedConsumers = loanConsumers + mediclaimConsumers + vehicleConsumers + lifeConsumers;
        const unassignedConsumers = Math.max(0, totalConsumers - assignedConsumers);
        
        console.log('📊 [STATS] Statistics calculation:', {
          totalConsumers,
          loanConsumers,
          mediclaimConsumers,
          vehicleConsumers,
          lifeConsumers,
          assignedConsumers,
          unassignedConsumers
        });
        
        setStatsData({
          totalConsumers,
          loanConsumers,
          mediclaimConsumers,
          vehicleConsumers,
          lifeConsumers,
          unassignedConsumers
        });
      }
    } catch (error) {
      console.error('Error fetching consumer statistics:', error);
    }
  };

  const getBuilderData = async () => {
    try {
      const builderResponse = await getAllBuilders();
      console.log('Builder API response:', builderResponse);
      
      if (builderResponse?.data && builderResponse?.data?.length) {
        console.log('Builder data:', builderResponse.data);
        setBuilderData(builderResponse.data);
      } else {
        console.log('No builder data found');
        setBuilderData([]);
      }
    } catch (error) {
      console.error('Error fetching builder data:', error);
      setBuilderData([]);
    }
  };

  const handleEdit = (userData) => {
    setEditData(userData);
    
    // Set form data
    setFormData({
      username: userData.username || '',
      phone_number: userData.mobileNumber || '',
      email: userData.email || '',
      referenceName: userData.referenceName || '',
      builderType: userData.builder_user || ''
    });

    // Set selected categories
    const categories = {
      loan: { checked: false, roleId: '' },
      mediclaim: { checked: false, roleId: '' },
      lifeInsurance: { checked: false, roleId: '' },
      vehicleInsurance: { checked: false, roleId: '' }
    };

    if (userData.category) {
      console.log('🔍 [FRONTEND] Editing user categories:', userData.category);
      userData.category.forEach(item => {
        console.log(`🔍 [FRONTEND] Processing category item:`, item);
        switch (item.category_id) {
          case 2: // Loan
            categories.loan = { checked: true, roleId: item.user_role_id };
            console.log(`🔍 [FRONTEND] Set loan category with roleId:`, item.user_role_id);
            break;
          case 4: // Mediclaim
            categories.mediclaim = { checked: true, roleId: item.user_role_id };
            console.log(`🔍 [FRONTEND] Set mediclaim category with roleId:`, item.user_role_id);
            break;
          case 5: // Life Insurance
            categories.lifeInsurance = { checked: true, roleId: item.user_role_id };
            console.log(`🔍 [FRONTEND] Set lifeInsurance category with roleId:`, item.user_role_id);
            break;
          case 6: // Vehicle Insurance
            categories.vehicleInsurance = { checked: true, roleId: item.user_role_id };
            console.log(`🔍 [FRONTEND] Set vehicleInsurance category with roleId:`, item.user_role_id);
            break;
        }
      });
    }
    
    console.log('🔍 [FRONTEND] Final categories to be set:', categories);
    setSelectedCategories(categories);
    setIsModalOpen(true);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCategoryChange = (category, checked) => {
    setSelectedCategories(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        checked,
        roleId: checked ? prev[category].roleId : ''
      }
    }));
  };

  const handleRoleChange = (category, roleId) => {
    console.log(`🔍 [FRONTEND] handleRoleChange called for category: ${category}, roleId: ${roleId}`);
    console.log(`🔍 [FRONTEND] Previous selectedCategories:`, selectedCategories);
    
    setSelectedCategories(prev => {
      const updated = {
        ...prev,
        [category]: {
          ...prev[category],
          roleId
        }
      };
      console.log(`🔍 [FRONTEND] Updated selectedCategories:`, updated);
      return updated;
    });
  };

  // const handleSubmit = async (e) => {
  //   e.preventDefault();
  //   setLoading(true);
    
  //   try {
  //     const payload = {
  //       ...formData,
  //       category: Object.entries(selectedCategories)
  //         .filter(([_, data]) => data.checked)
  //         .map(([category, data]) => {
  //           const categoryIdMap = {
  //             loan: 2,
  //             mediclaim: 4,
  //             lifeInsurance: 5,
  //             vehicleInsurance: 6
  //           };
  //           return {
  //             category_id: categoryIdMap[category],
  //             user_role_id: data.roleId
  //           };
  //         })
  //     };

  //     console.log('🔍 [FRONTEND] Consumer creation payload:', payload);
  //     console.log('🔍 [FRONTEND] Selected categories:', selectedCategories);
  //     console.log('🔍 [FRONTEND] Form data:', formData);
  //     console.log('🔍 [FRONTEND] Selected categories details:');
  //     Object.entries(selectedCategories).forEach(([category, data]) => {
  //       console.log(`  ${category}:`, data);
  //     });

  //     if (editData) {
  //       await updateConsumerUser({ user_id: editData.user_id, ...payload });
  //     } else {
  //       await addConsumerUser(payload);
  //     }
      
  //     toggleModal();
  //   getConsumerData();
  //   } catch (error) {
  //     console.error('Error saving consumer:', error);
  //   } finally {
  //     setLoading(false);
  //   }
  // };


const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  
  try {
    const payload = {
      ...formData,
      category: Object.entries(selectedCategories)
        .filter(([_, data]) => data.checked)
        .map(([category, data]) => {
          const categoryIdMap = {
            loan: 2,
            mediclaim: 4,
            lifeInsurance: 5,
            vehicleInsurance: 6,
          };
          return {
            category_id: categoryIdMap[category],
            user_role_id: data.roleId,
          };
        }),
    };

    console.log('📤 Consumer creation payload:', payload);

    let response;
    if (editData) {
      response = await updateConsumerUser({ user_id: editData.user_id, ...payload });
    } else {
      response = await addConsumerUser(payload);

      // ✅ Trigger local event (optional but instant for the same user)
      const newNotification = response?.data?.notification || {
        id: Date.now(),
        type: 'consumer',
        title: 'New Consumer Added',
        message: `Consumer ${payload.username} has been added.`,
        is_read: false,
        created_at: new Date().toISOString(),
      };
      window.dispatchEvent(new CustomEvent('app:new-notification', { detail: newNotification }));
    }

    toggleModal();
    getConsumerData();
  } catch (error) {
    console.error('❌ Error saving consumer:', error);
  } finally {
    setLoading(false);
  }
};


  const getRoleOptions = (categoryId) => {
    console.log(`🔍 [FRONTEND] getRoleOptions called for category ${categoryId}`);
    console.log(`🔍 [FRONTEND] Current roleData state:`, roleData);
    console.log(`🔍 [FRONTEND] roleData for category ${categoryId}:`, roleData[categoryId]);
    
    if (!roleData[categoryId] || !Array.isArray(roleData[categoryId])) {
      console.log(`❌ [FRONTEND] No role data for category ${categoryId}:`, roleData[categoryId]);
      console.log(`❌ [FRONTEND] Available categories in roleData:`, Object.keys(roleData));
      return [];
    }
    
    console.log(`🔍 [FRONTEND] Processing ${roleData[categoryId].length} users for category ${categoryId}`);
    
    const options = roleData[categoryId].map(role => {
      console.log(`🔍 [FRONTEND] Processing role object:`, role);
      console.log(`🔍 [FRONTEND] role.user_id:`, role.user_id);
      console.log(`🔍 [FRONTEND] role.username:`, role.username);
      console.log(`🔍 [FRONTEND] role.email:`, role.email);
      console.log(`🔍 [FRONTEND] role.role_id:`, role.role_id);
      
      const option = {
        value: role.user_id, // Use user_id instead of user_role_id
        label: role.username // Use username instead of role_name
      };
      console.log(`🔍 [FRONTEND] Created option:`, option);
      return option;
    });
    
    console.log(`🔍 [FRONTEND] Final role options for category ${categoryId}:`, options);
    console.log(`🔍 [FRONTEND] Options values:`, options.map(opt => opt.value));
    console.log(`🔍 [FRONTEND] Options labels:`, options.map(opt => opt.label));
    return options;
  };

  const getBuilderOptions = () => {
    console.log('Building options from builderData:', builderData);
    
    if (!builderData || !Array.isArray(builderData)) {
      console.log('No builder data available');
      return [];
    }
    
    const options = builderData.map(builder => {
      // Try different possible field names
      const value = builder.user_id || builder.id || builder.builder_id || builder['builderuser.builder_id'];
      const label = builder.username || builder.name || builder.builder_name || builder.builderuser?.builder_name;
      
      console.log('Builder item:', builder, 'Value:', value, 'Label:', label);
      
      return {
        value: value,
        label: label || 'Unknown Builder'
      };
    }).filter(option => option.value && option.label); // Filter out invalid options
    
    console.log('Generated builder options:', options);
    return options;
  };

  // Helper function to get the selected option object for React Select
  const getSelectedRoleOption = (categoryId, roleId) => {
    console.log(`🔍 [FRONTEND] getSelectedRoleOption called for category ${categoryId}, roleId: ${roleId}`);
    if (!roleId) {
      console.log(`🔍 [FRONTEND] No roleId provided, returning null`);
      return null;
    }
    const options = getRoleOptions(categoryId);
    const selectedOption = options.find(option => option.value === roleId);
    console.log(`🔍 [FRONTEND] Found selected option:`, selectedOption);
    return selectedOption || null;
  };

  // ── Family / household handlers ──
  const loadHousehold = async (mobile) => {
    setFamilyLoading(true);
    const res = await getHousehold(mobile);
    setHousehold(res && res.status && res.data ? (res.data.members || []) : []);
    setFamilyLoading(false);
  };

  const handleViewFamily = async (row) => {
    setFamilyHead(row);
    setFamilyForm({ username: '', phone_number: '', email: '', referenceName: '' });
    setFamilyOpen(true);
    if (row && row.mobileNumber) await loadHousehold(row.mobileNumber);
  };

  const closeFamily = () => {
    setFamilyOpen(false);
    setFamilyHead(null);
    setHousehold([]);
  };

  const submitFamilyMember = async (e) => {
    e.preventDefault();
    if (!familyForm.username || !familyForm.phone_number) {
      toast.error('Name and mobile number are required');
      return;
    }
    if (!/^\d{10}$/.test(familyForm.phone_number)) {
      toast.error('Mobile number must be 10 digits');
      return;
    }
    const res = await addFamilyMember({
      head_user_id: familyHead.user_id,
      username: familyForm.username,
      phone_number: familyForm.phone_number,
      email: familyForm.email,
      referenceName: familyForm.referenceName,
    });
    if (res && res.status) {
      toast.success('Family member added');
      setFamilyForm({ username: '', phone_number: '', email: '', referenceName: '' });
      await loadHousehold(familyHead.mobileNumber);
    }
  };

  return (
    <DashboardLayout onSearch={handleSearch}>
      <div className="consumer-container">
        <div className="consumer-header">
          <h1>Consumer Management</h1>
          {user && user.role_id !== ROLE_IDS.BUILDING_MANAGER && (
            <Button 
              className="add-consumer-btn" 
              onClick={toggleModal}
            >
              + Add Consumer
            </Button>
          )}
      </div>

        {/* Statistics Cards Section */}
        {/* <div className="stat-cards-container">
          <div 
            className={`stat-card ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => handleCardClick('all')}
            style={{ '--card-color': '#2196F3' }}
          >
            <div className="stat-number">{statsData.totalConsumers}</div>
            <div className="stat-title">Total Consumers</div>
            <div className="stat-description">All registered consumers</div>
          </div>
          
          <div 
            className={`stat-card ${activeFilter === 'loan' ? 'active' : ''}`}
            onClick={() => handleCardClick('loan')}
            style={{ '--card-color': '#FF9800' }}
          >
            <div className="stat-number">{statsData.loanConsumers}</div>
            <div className="stat-title">💰 Loan</div>
            <div className="stat-description">Loan category users</div>
          </div>
          
          <div 
            className={`stat-card ${activeFilter === 'mediclaim' ? 'active' : ''}`}
            onClick={() => handleCardClick('mediclaim')}
            style={{ '--card-color': '#00BCD4' }}
          >
            <div className="stat-number">{statsData.mediclaimConsumers}</div>
            <div className="stat-title">🏥 Mediclaim</div>
            <div className="stat-description">Mediclaim category users</div>
          </div>
          
          <div 
            className={`stat-card ${activeFilter === 'vehicle' ? 'active' : ''}`}
            onClick={() => handleCardClick('vehicle')}
            style={{ '--card-color': '#4CAF50' }}
          >
            <div className="stat-number">{statsData.vehicleConsumers}</div>
            <div className="stat-title">🚗 Vehicle</div>
            <div className="stat-description">Vehicle category users</div>
          </div>
          
          <div 
            className={`stat-card ${activeFilter === 'life' ? 'active' : ''}`}
            onClick={() => handleCardClick('life')}
            style={{ '--card-color': '#9C27B0' }}
          >
            <div className="stat-number">{statsData.lifeConsumers}</div>
            <div className="stat-title">🛡️ Life Insurance</div>
            <div className="stat-description">Life insurance users</div>
          </div>
          
          <div 
            className={`stat-card ${activeFilter === 'unassigned' ? 'active' : ''}`}
            onClick={() => handleCardClick('unassigned')}
            style={{ '--card-color': '#F44336' }}
          >
            <div className="stat-number">{statsData.unassignedConsumers}</div>
            <div className="stat-title">❓ Unassigned</div>
            <div className="stat-description">No category assigned</div>
          </div>
        </div> */}
{/* Show stats only if NOT building manager */}
{user?.role_id !== ROLE_IDS.BUILDING_MANAGER && (
  <div className="stat-cards-container">
    <div 
      className={`stat-card ${activeFilter === 'all' ? 'active' : ''}`}
      onClick={() => handleCardClick('all')}
      style={{ '--card-color': '#2196F3' }}
    >
      <div className="stat-number">{statsData.totalConsumers}</div>
      <div className="stat-title">Total Consumers</div>
      <div className="stat-description">All registered consumers</div>
    </div>
    
    <div 
      className={`stat-card ${activeFilter === 'loan' ? 'active' : ''}`}
      onClick={() => handleCardClick('loan')}
      style={{ '--card-color': '#FF9800' }}
    >
      <div className="stat-number">{statsData.loanConsumers}</div>
      <div className="stat-title">💰 Loan</div>
      <div className="stat-description">Loan category users</div>
    </div>

    <div 
      className={`stat-card ${activeFilter === 'mediclaim' ? 'active' : ''}`}
      onClick={() => handleCardClick('mediclaim')}
      style={{ '--card-color': '#00BCD4' }}
    >
      <div className="stat-number">{statsData.mediclaimConsumers}</div>
      <div className="stat-title">🏥 Mediclaim</div>
      <div className="stat-description">Mediclaim users</div>
    </div>

    <div 
      className={`stat-card ${activeFilter === 'vehicle' ? 'active' : ''}`}
      onClick={() => handleCardClick('vehicle')}
      style={{ '--card-color': '#4CAF50' }}
    >
      <div className="stat-number">{statsData.vehicleConsumers}</div>
      <div className="stat-title">🚗 Vehicle</div>
      <div className="stat-description">Vehicle insurance users</div>
    </div>

    <div 
      className={`stat-card ${activeFilter === 'life' ? 'active' : ''}`}
      onClick={() => handleCardClick('life')}
      style={{ '--card-color': '#9C27B0' }}
    >
      <div className="stat-number">{statsData.lifeConsumers}</div>
      <div className="stat-title">🛡️ Life Insurance</div>
      <div className="stat-description">Life insurance users</div>
    </div>

    <div 
      className={`stat-card ${activeFilter === 'unassigned' ? 'active' : ''}`}
      onClick={() => handleCardClick('unassigned')}
      style={{ '--card-color': '#F44336' }}
    >
      <div className="stat-number">{statsData.unassignedConsumers}</div>
      <div className="stat-title">❓ Unassigned</div>
      <div className="stat-description">No category assigned</div>
    </div>
  </div>
)}

        <div className="consumer-table-container">
        <Table
          columns={heading.map(h => ({ key: h.key, title: h.head }))}
          data={filteredData}
          onEdit={handleEdit}
          onView={handleViewFamily}
          pagination={true}
          itemsPerPage={itemsPerPage}
          loading={loading}
          />
        </div>

        <Modal
          open={isModalOpen}
          onClose={toggleModal}
          title={editData ? 'Edit Consumer' : 'Add New Consumer'}
        >
          <form onSubmit={handleSubmit} className="consumer-form">
            <div className="form-section">
              <h5>Basic Information</h5>
              <div className="form-row">
                <div className="form-group">
                  <label>Name *</label>
                  <Input
                    type="text"
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    placeholder="Enter full name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Mobile Number *</label>
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
                      value={formData.phone_number} 
                      className="form-control mobile" 
                      onChange={(e) => handleInputChange('phone_number', e.target.value)} 
                      placeholder="Enter mobile number" 
                      required
                      maxLength="10"
                    />
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Email *</label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Enter email address"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Reference Name</label>
                  <Input
                    type="text"
                    value={formData.referenceName}
                    onChange={(e) => handleInputChange('referenceName', e.target.value)}
                    placeholder="Enter reference name"
                  />
                </div>
              </div>

              {user && user.role_id === ROLE_IDS.SUPER_ADMIN && (
                <div className="form-row">
                  <div className="form-group">
                    <label>Builder Type</label>
                    <Select
                      options={getBuilderOptions()}
                      value={formData.builderType ? getBuilderOptions().find(option => option.value === formData.builderType) : null}
                      onChange={(option) => handleInputChange('builderType', option ? option.value : '')}
                      placeholder="Select builder type"
                      isClearable
                    />
                  </div>
                  <div className="form-group">
                    {/* Empty div for grid alignment */}
                  </div>
                </div>
              )}
            </div>

            <div className="categories-section">
              <h4>Service Categories</h4>
              <div className="category-grid">
                <div className="category-item">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={selectedCategories.loan.checked}
                      onChange={(e) => handleCategoryChange('loan', e.target.checked)}
                    />
                    <span>Loan</span>
                  </label>
                  {selectedCategories.loan.checked && (
                                          <Select
                        options={getRoleOptions(2)}
                        value={getSelectedRoleOption(2, selectedCategories.loan.roleId)}
                        onChange={(option) => {
                        console.log('🔍 [FRONTEND] Select onChange called for loan with option:', option);
                        if (option && option.value) {
                          console.log('🔍 [FRONTEND] Valid option selected, calling handleRoleChange with:', option.value);
                          handleRoleChange('loan', option.value);
                        } else {
                          console.log('❌ [FRONTEND] Invalid option received:', option);
                        }
                      }}
                      placeholder="Select role"
                      onMenuOpen={() => {
                        console.log('🔍 [FRONTEND] Loan Select menu opened');
                        console.log('🔍 [FRONTEND] Available options:', getRoleOptions(2));
                        console.log('🔍 [FRONTEND] Current selected value:', selectedCategories.loan.roleId);
                      }}
                    />
                  )}
                </div>

                <div className="category-item">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={selectedCategories.mediclaim.checked}
                      onChange={(e) => handleCategoryChange('mediclaim', e.target.checked)}
                    />
                    <span>Mediclaim</span>
                  </label>
                  {selectedCategories.mediclaim.checked && (
                                          <Select
                        options={getRoleOptions(4)}
                        value={getSelectedRoleOption(4, selectedCategories.mediclaim.roleId)}
                        onChange={(option) => {
                        console.log('🔍 [FRONTEND] Select onChange called for mediclaim with option:', option);
                        if (option && option.value) {
                          console.log('🔍 [FRONTEND] Valid option selected, calling handleRoleChange with:', option.value);
                          handleRoleChange('mediclaim', option.value);
                        } else {
                          console.log('❌ [FRONTEND] Invalid option received:', option);
                        }
                      }}
                      placeholder="Select role"
                    />
                  )}
                </div>

                <div className="category-item">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={selectedCategories.lifeInsurance.checked}
                      onChange={(e) => handleCategoryChange('lifeInsurance', e.target.checked)}
                    />
                    <span>Life Insurance</span>
                  </label>
                  {selectedCategories.lifeInsurance.checked && (
                                          <Select
                        options={getRoleOptions(5)}
                        value={getSelectedRoleOption(5, selectedCategories.lifeInsurance.roleId)}
                        onChange={(option) => {
                        console.log('🔍 [FRONTEND] Select onChange called for lifeInsurance with option:', option);
                        if (option && option.value) {
                          console.log('🔍 [FRONTEND] Valid option selected, calling handleRoleChange with:', option.value);
                          handleRoleChange('lifeInsurance', option.value);
                        } else {
                          console.log('❌ [FRONTEND] Invalid option received:', option);
                        }
                      }}
                      placeholder="Select role"
                    />
                  )}
                </div>

                <div className="category-item">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={selectedCategories.vehicleInsurance.checked}
                      onChange={(e) => handleCategoryChange('vehicleInsurance', e.target.checked)}
                    />
                    <span>Vehicle Insurance</span>
                  </label>
                  {selectedCategories.vehicleInsurance.checked && (
                                          <Select
                        options={getRoleOptions(6)}
                        value={getSelectedRoleOption(6, selectedCategories.vehicleInsurance.roleId)}
                        onChange={(option) => {
                        console.log('🔍 [FRONTEND] Select onChange called for vehicleInsurance with option:', option);
                        if (option && option.value) {
                          console.log('🔍 [FRONTEND] Valid option selected, calling handleRoleChange with:', option.value);
                          handleRoleChange('vehicleInsurance', option.value);
                        } else {
                          console.log('❌ [FRONTEND] Invalid option received:', option);
                        }
                      }}
                      placeholder="Select role"
                    />
                  )}
                </div>
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
              {editData && editData.user_id && (
                <Button
                  type="button"
                  className="submit-btn"
                  style={{ background: '#374151' }}
                  onClick={() => { toggleModal(); handleViewFamily(editData); }}
                >
                  + Add Family Member
                </Button>
              )}
            </div>
          </form>
        </Modal>

        {/* Family / household modal */}
        <Modal
          open={familyOpen}
          onClose={closeFamily}
          title={familyHead ? `Family of ${familyHead.username || familyHead.mobileNumber}` : 'Family'}
        >
          <div className="family-modal consumer-form">
            <div className="form-section">
              <div className="family-section-head">
                <h5>Household Members</h5>
                {!familyLoading && <span className="family-count">{household.length}</span>}
              </div>

              {familyLoading ? (
                <p className="family-empty">Loading…</p>
              ) : household.length === 0 ? (
                <p className="family-empty">No family members yet. Add one below.</p>
              ) : (
                <div className="family-roster">
                  {household.map((m) => {
                    const p = m.policies || {};
                    const badges = [
                      { k: 'Vehicle', n: p.vehicle?.length || 0 },
                      { k: 'Loan', n: p.loan?.length || 0 },
                      { k: 'Mediclaim', n: p.mediclaim?.length || 0 },
                      { k: 'Life', n: p.life?.length || 0 },
                    ].filter((b) => b.n > 0);
                    return (
                      <div className="family-card" key={m.user_id}>
                        <div className="fm-avatar">{(m.username || '?').charAt(0).toUpperCase()}</div>
                        <div className="fm-info">
                          <div className="fm-name-row">
                            <span className="fm-name">{m.username || 'Unnamed'}</span>
                            <span className={`fm-tag ${m.isHead ? 'head' : ''}`}>{m.isHead ? 'Head' : 'Member'}</span>
                          </div>
                          <div className="fm-mobile">📞 {m.mobileNumber}</div>
                          <div className="fm-policies">
                            {badges.length ? (
                              badges.map((b) => <span className="fm-badge" key={b.k}>{b.k} · {b.n}</span>)
                            ) : (
                              <span className="fm-badge muted">No policies</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="form-section family-add-section">
              <h5>Add Family Member</h5>
              <form onSubmit={submitFamilyMember}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Name *</label>
                    <Input type="text" value={familyForm.username} placeholder="Full name"
                      onChange={(e) => setFamilyForm({ ...familyForm, username: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Mobile Number *</label>
                    <Input type="tel" value={familyForm.phone_number} placeholder="10-digit mobile" maxLength="10"
                      onChange={(e) => setFamilyForm({ ...familyForm, phone_number: e.target.value })} required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Email</label>
                    <Input type="email" value={familyForm.email} placeholder="Optional"
                      onChange={(e) => setFamilyForm({ ...familyForm, email: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Relation</label>
                    <Input type="text" value={familyForm.referenceName} placeholder="e.g. Son, Spouse"
                      onChange={(e) => setFamilyForm({ ...familyForm, referenceName: e.target.value })} />
                  </div>
                </div>
                <div className="form-actions">
                  <Button type="submit" className="submit-btn">+ Add Member</Button>
                </div>
              </form>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default Consumer;
