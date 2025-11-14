import React, { useEffect, useState } from 'react';
import '../styles/pages/Blog.css';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer.js';
import { getAllBlogsPublic } from '../serviceAPI/userAPI';
import Navbar from '../components/Navbar';

const Blog = () => {
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchBlogs = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await getAllBlogsPublic();
                
                if (response && response.status && response.data) {
                    setBlogs(response.data);
                } else if (response && Array.isArray(response)) {
                    setBlogs(response);
                } else {
                    setBlogs([]);
                }
            } catch (error) {
                console.error('Error fetching blogs:', error);
                setError('Failed to load blogs. Please try again later.');
                setBlogs([]);
            } finally {
                setLoading(false);
            }
        };
        fetchBlogs();
    }, []);

    const renderBlogs = () => {
        if (!blogs.length) {
            return (
                <div className="text-center">
                    <div className="no-blogs">
                        <i className="bi bi-journal-text" style={{ fontSize: '3rem', color: '#ccc' }}></i>
                        <h3>No blogs found</h3>
                        <p>Check back later for new content!</p>
                    </div>
                </div>
            );
        }
        
        return (
            <div className='row blog-home'>
                {blogs.map((blog) => (
                    <div className='col-lg-4 col-md-6 mb-4' key={blog.id}>
                        <div className='blog-box'>
                            <div className='blog-box-img'>
                                <img 
                                    src={blog.image ? (blog.image.startsWith('http') ? blog.image : `${process.env.REACT_APP_BASE_URL}/uploads/${blog.image}`) : '/Assets/are-you-covered.jpg'} 
                                    alt={blog.title} 
                                    className='img-fluid'
                                    onError={(e) => {
                                        e.target.src = '/Assets/are-you-covered.jpg';
                                    }}
                                />
                            </div>
                            <div className='blog-box-content'>
                                <h3>{blog.title}</h3>
                                <p>{blog.content?.slice(0, 150) || ''}...</p>
                                <Link to={`/blog/${blog.id}`} className='btn btn-primary read-more-btn'>
                                    Read More <i className="bi bi-arrow-right ms-2"></i>
                                </Link>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <>
        <Navbar />
        <div className="blog blogpage">
            <div className="container">
                <div className="row">
                    <div className="col-12">
                        <div className="blog-heading text-center mb-5">
                            <h1 className="heading">Our Blog</h1>
                            <p className="subtitle">Recent Insights & Updates</p>
                        </div>
                        
                        {loading ? (
                            <div className="text-center">
                                <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                                <p className="mt-3">Loading blogs...</p>
                            </div>
                        ) : error ? (
                            <div className="text-center">
                                <div className="alert alert-danger" role="alert">
                                    <i className="bi bi-exclamation-triangle me-2"></i>
                                    {error}
                                </div>
                                <button 
                                    className="btn btn-primary mt-3"
                                    onClick={() => window.location.reload()}
                                >
                                    Try Again
                                </button>
                            </div>
                        ) : (
                            renderBlogs()
                        )}
                    </div>
                </div>
            </div>
        </div>
        <Footer />
        </>
    );
};

export default Blog;