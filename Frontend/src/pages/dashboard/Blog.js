import React, { useEffect, useState } from 'react';
import { getAllBlogs, deleteBlog, addBlog, updateBlog, getBlogById } from '../../serviceAPI/userAPI';
import { useToaster } from '../../components/Toaster';
import DashboardLayout from '../../components/DashboardLayout';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import '../../styles/pages/dashboard/Consumer.css';



const Blog = () => {
    const [blogs, setBlogs] = useState([]);
    const [filteredBlogs, setFilteredBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);
    const [sortColumn, setSortColumn] = useState(null);
    const [sortDirection, setSortDirection] = useState('asc');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedBlog, setSelectedBlog] = useState(null);
    const [formState, setFormState] = useState({
        title: '',
        content: '',
        image: null,
        author: '',
        category: '',
        tags: '',
        status: 'draft'
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const addToast = useToaster();

    const headings = [
        { key: 'title', title: 'Title' },
        { key: 'category', title: 'Category' },
        { key: 'author', title: 'Author' },
        { key: 'status', title: 'Status' },
        { key: 'created_at', title: 'Created At' }
    ];

    useEffect(() => {
        fetchBlogs();
    }, []);

    useEffect(() => {
        if (selectedBlog) {
            // Handle tags - convert array to string if needed
            let tagsString = '';
            if (selectedBlog.tags) {
                if (Array.isArray(selectedBlog.tags)) {
                    tagsString = selectedBlog.tags.join(', ');
                } else if (typeof selectedBlog.tags === 'string') {
                    try {
                        const parsedTags = JSON.parse(selectedBlog.tags);
                        tagsString = Array.isArray(parsedTags) ? parsedTags.join(', ') : selectedBlog.tags;
                    } catch {
                        tagsString = selectedBlog.tags;
                    }
                }
            }

            setFormState({
                title: selectedBlog.title || '',
                content: selectedBlog.content || '',
                image: selectedBlog.image || null,
                author: selectedBlog.author || '',
                category: selectedBlog.category || '',
                tags: tagsString,
                status: selectedBlog.status || 'draft'
            });
        } else {
            // Reset form when creating new blog
            setFormState({
                title: '',
                content: '',
                image: null,
                author: '',
                category: '',
                tags: '',
                status: 'draft'
            });
        }
    }, [selectedBlog]);

    const fetchBlogs = async () => {
        try {
            setLoading(true);
            const response = await getAllBlogs();
            
            if (response && response.status && response.data) {
                const formattedData = response.data.map((item) => ({
                    id: item.id,
                    title: item.title || '',
                    category: item.category || '',
                    author: item.author || '',
                    status: item.status || '',
                    created_at: new Date(item.created_at).toLocaleDateString()
                }));
                
                setBlogs(formattedData);
                setFilteredBlogs(formattedData);
            } else {
                console.error('Invalid response format:', response);
                addToast('Error: Invalid response format', 'error');
            }
        } catch (error) {
            console.error('Error fetching blogs:', error);
            addToast('Error fetching blogs', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSort = (column) => {
        const direction = sortColumn === column && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortColumn(column);
        setSortDirection(direction);
    };

    const handleEdit = async (blog) => {
        try {
            // Fetch the full blog data for editing using getBlogById
            const response = await getBlogById(blog.id);
            
            if (response && response.id) {
                setSelectedBlog(response);
            } else {
                setSelectedBlog(blog);
            }
        } catch (error) {
            console.error('Error fetching full blog data:', error);
            addToast('Error fetching blog details', 'error');
            setSelectedBlog(blog);
        }
        
        setIsModalOpen(true);
    };

    const handleDelete = async (blog) => {
        if (window.confirm('Are you sure you want to delete this blog?')) {
            try {
                await deleteBlog(blog.id);
                addToast('Blog deleted successfully', 'success');
                fetchBlogs();
            } catch (error) {
                console.error('Error deleting blog:', error);
                addToast('Error deleting blog', 'error');
            }
        }
    };

    const toggleModal = () => {
        setIsModalOpen(!isModalOpen);
        if (!isModalOpen) {
            setSelectedBlog(null);
            setFormState({
                title: '',
                content: '',
                image: null,
                author: '',
                category: '',
                tags: '',
                status: 'draft'
            });
            setErrors({});
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formState.title.trim()) newErrors.title = 'Title is required';
        if (!formState.content.trim()) newErrors.content = 'Content is required';
        if (!formState.author.trim()) newErrors.author = 'Author is required';
        if (!formState.category.trim()) newErrors.category = 'Category is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('title', formState.title);
            formData.append('content', formState.content);
            formData.append('author', formState.author);
            formData.append('category', formState.category);
            formData.append('tags', formState.tags);
            formData.append('status', formState.status);
            if (formState.image) {
                formData.append('image', formState.image);
            }

            if (selectedBlog) {
                await updateBlog(selectedBlog.id, formData);
                addToast('Blog updated successfully', 'success');
            } else {
                await addBlog(formData);
                addToast('Blog created successfully', 'success');
            }
            fetchBlogs();
            toggleModal();
        } catch (error) {
            console.error('Error saving blog:', error);
            addToast('Error saving blog', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleInputChange = (field, value) => {
        setFormState(prev => ({ ...prev, [field]: value }));
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormState(prev => ({ ...prev, image: file }));
        }
    };

    // Filter data when search query changes
    const handleSearch = (searchQuery) => {
        if (!searchQuery.trim()) {
            setFilteredBlogs(blogs);
            return;
        }

        const filtered = blogs.filter(row =>
            Object.values(row).some(value =>
                String(value || '').toLowerCase().includes(searchQuery.toLowerCase())
            )
        );
        setFilteredBlogs(filtered);
    };

    return (
        <DashboardLayout onSearch={handleSearch}>
            <div className="consumer-container">
                <div className="consumer-header">
                <h1>Blog Management</h1>
                <Button 
                        className="add-consumer-btn"
                    onClick={() => {
                        setSelectedBlog(null);
                            setIsModalOpen(true);
                    }}
                >
                        + Add Blog
                </Button>
            </div>

            <div className="consumer-table-container">
                <Table
                    columns={headings}
                    data={filteredBlogs}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    pagination={true}
                    itemsPerPage={itemsPerPage}
                    loading={loading}
                />
            </div>

                {isModalOpen && (
                    <Modal
                        open={isModalOpen}
                        onClose={toggleModal}
                        title={selectedBlog ? 'Edit Blog' : 'Create Blog'}
                    >
                        <form onSubmit={handleSubmit} className="blog-form">
                            <div className="form-section">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Title *</label>
                                        <Input
                                            type="text"
                                            value={formState.title || ''}
                                            onChange={(e) => handleInputChange('title', e.target.value)}
                                            placeholder="Enter blog title"
                                            required
                                        />

                                        {errors.title && <div className="text-danger">{errors.title}</div>}
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Content *</label>
                                        <textarea
                                            className="form-control"
                                            rows="5"
                                            value={formState.content || ''}
                                            onChange={(e) => handleInputChange('content', e.target.value)}
                                            placeholder="Enter blog content"
                                            required
                                        />

                                        {errors.content && <div className="text-danger">{errors.content}</div>}
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Author *</label>
                                        <Input
                                            type="text"
                                            value={formState.author || ''}
                                            onChange={(e) => handleInputChange('author', e.target.value)}
                                            placeholder="Enter author name"
                                            required
                                        />

                                        {errors.author && <div className="text-danger">{errors.author}</div>}
                                    </div>
                                    <div className="form-group">
                                        <label>Category *</label>
                                        <Input
                                            type="text"
                                            value={formState.category || ''}
                                            onChange={(e) => handleInputChange('category', e.target.value)}
                                            placeholder="Enter category"
                                            required
                                        />

                                        {errors.category && <div className="text-danger">{errors.category}</div>}
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Tags (comma separated)</label>
                                        <Input
                                            type="text"
                                            value={formState.tags || ''}
                                            onChange={(e) => handleInputChange('tags', e.target.value)}
                                            placeholder="Enter tags separated by commas"
                                        />

                                    </div>
                                    <div className="form-group">
                                        <label>Status</label>
                                        <Select
                                            options={[
                                                { value: 'draft', label: 'Draft' },
                                                { value: 'published', label: 'Published' }
                                            ]}
                                            value={formState.status ? { value: formState.status, label: formState.status.charAt(0).toUpperCase() + formState.status.slice(1) } : null}
                                            onChange={(option) => handleInputChange('status', option ? option.value : 'draft')}
                                            placeholder="Select status"
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Featured Image</label>
                                        <input
                                            type="file"
                                            className="form-control"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                        />
                                        {selectedBlog?.image && (
                                            <div className="mt-2">
                                                <p className="text-muted mb-2">Current Image:</p>
                                                <img 
                                                    src={selectedBlog.image.startsWith('http') ? selectedBlog.image : `${process.env.REACT_APP_BASE_URL}/uploads/${selectedBlog.image}`} 
                                                    alt="Current featured" 
                                                    style={{ 
                                                        maxWidth: '200px', 
                                                        maxHeight: '200px',
                                                        border: '1px solid #ddd',
                                                        borderRadius: '4px',
                                                        objectFit: 'cover'
                                                    }} 
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="form-actions">
                                <Button
                                    type="submit"
                                    className="submit-btn"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Saving...' : (selectedBlog ? 'Update' : 'Create')}
                                </Button>
                            </div>
                        </form>
                    </Modal>
                )}
            </div>
        </DashboardLayout>
    );
};

export default Blog; 