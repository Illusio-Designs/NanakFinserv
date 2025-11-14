import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getBlogByIdPublic } from '../serviceAPI/userAPI';
import Footer from '../components/Footer';
import Navbar from '../components/Navbar';
import '../styles/pages/Blog.css';

const BlogDetail = () => {
  const { id } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getBlogByIdPublic(id);
        
        if (response && response.id) {
          setBlog(response);
        } else if (response && response.data) {
          setBlog(response.data);
        } else if (response && response.status && response.data) {
          setBlog(response.data);
        } else {
          setError('Blog not found');
        }
      } catch (err) {
        console.error('Error fetching blog:', err);
        setError('Error fetching blog. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchBlog();
  }, [id]);

  if (loading) return (
    <>
      <Navbar />
      <div className="blog blogpage">
        <div className="container">
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3">Loading blog...</p>
          </div>
        </div>
      </div>
    </>
  );
  
  if (error) return (
    <>
      <Navbar />
      <div className="blog blogpage">
        <div className="container">
          <div className="text-center">
            <div className="alert alert-danger" role="alert">
              <i className="bi bi-exclamation-triangle me-2"></i>
              {error}
            </div>
            <Link to="/blog" className="btn btn-primary mt-3">
              Back to Blogs
            </Link>
          </div>
        </div>
      </div>
    </>
  );
  
  if (!blog) return (
    <>
      <Navbar />
      <div className="blog">
        <div className="container">
          <div className="text-center">
            <div className="alert alert-warning" role="alert">
              <i className="bi bi-question-circle me-2"></i>
              No blog found.
            </div>
            <Link to="/blog" className="btn btn-primary mt-3">
              Back to Blogs
            </Link>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      <Navbar />
      <div className="blog blogpage">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-10">
              <div className="blog-detail-clean">
                {/* Featured Image */}
                {blog.image && (
                  <div className="blog-hero-image mb-4">
                                    <img 
                  src={blog.image ? (blog.image.startsWith('http') ? blog.image : `${process.env.REACT_APP_BASE_URL}/uploads/${blog.image}`) : '/Assets/are-you-covered.jpg'} 
                  alt={blog.title} 
                  className="img-fluid"
                  onError={(e) => {
                    e.target.src = '/Assets/are-you-covered.jpg';
                  }}
                />
                  </div>
                )}

                {/* Title */}
                <h1 className="blog-title mb-4">{blog.title}</h1>

                {/* Meta Info - Single Line */}
                <div className="blog-meta-single-line mb-5">
                  {blog.category && (
                    <span className="meta-item category">
                      <i className="bi bi-tag me-1"></i>
                      {blog.category}
                    </span>
                  )}
                  <span className="meta-item author">
                    <i className="bi bi-person me-1"></i>
                    {blog.author || 'Unknown Author'}
                  </span>
                  <span className="meta-item date">
                    <i className="bi bi-calendar me-1"></i>
                    {blog.created_at ? new Date(blog.created_at).toLocaleDateString() : ''}
                  </span>
                </div>

                {/* Content */}
                <div className="blog-content-clean">
                  {blog.content}
                </div>


              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default BlogDetail; 