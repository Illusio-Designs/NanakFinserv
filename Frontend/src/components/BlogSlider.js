import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getAllBlogsPublic } from '../serviceAPI/userAPI';

const BlogSlider = ({ title = "Recent Insights & Updates", showViewAll = true }) => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const sliderRef = useRef(null);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        setLoading(true);
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
        setBlogs([]);
      } finally {
        setLoading(false);
      }
    };
    fetchBlogs();
  }, []);

  const nextSlide = () => {
    if (blogs.length > 3) {
      setCurrentIndex((prevIndex) => 
        prevIndex + 3 >= blogs.length ? 0 : prevIndex + 3
      );
    }
  };

  const prevSlide = () => {
    if (blogs.length > 3) {
      setCurrentIndex((prevIndex) => 
        prevIndex - 3 < 0 ? Math.max(0, blogs.length - 3) : prevIndex - 3
      );
    }
  };

  const visibleBlogs = blogs.slice(currentIndex, currentIndex + 3);

  if (loading) {
    return (
      <section className="blog">
        <div className="container">
          <div className="row">
            <div className="col-12">
              <div className="blog-heading text-center">
                <Link to="/blog" className="btn mb-4">Our Blog</Link>
                <h1 className="heading">{title}</h1>
              </div>
              <div className="blog-heading d-flex justify-content-between align-items-center">
                <div></div>
                {showViewAll && (
                  <Link to="/blog" className="btn btn-primary">View All Blogs</Link>
                )}
              </div>
            </div>
            <div className="col-12 text-center">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!blogs.length) {
    return null;
  }

  return (
    <section className="blog">
      <div className="container">
        <div className="row">
          <div className="col-12">
            <div className="blog-heading text-center">
              <Link to="/blog" className="btn mb-4">Our Blog</Link>
              <h1 className="heading">{title}</h1>
            </div>
            <div className="blog-heading d-flex justify-content-between align-items-center">
              <div></div>
              {showViewAll && (
                <Link to="/blog" className="btn btn-primary">View All Blogs</Link>
              )}
            </div>
          </div>
        </div>
        
        <div className="blog-slider-container position-relative">
          {/* Navigation Arrows */}
          {blogs.length > 3 && (
            <>
              <button 
                className="blog-slider-arrow blog-slider-arrow-left"
                onClick={prevSlide}
                aria-label="Previous blogs"
              >
                <i className="bi bi-chevron-left"></i>
              </button>
              <button 
                className="blog-slider-arrow blog-slider-arrow-right"
                onClick={nextSlide}
                aria-label="Next blogs"
              >
                <i className="bi bi-chevron-right"></i>
              </button>
            </>
          )}
          
          {/* Blog Cards */}
          <div className="row blog-slider" ref={sliderRef}>
            {visibleBlogs.map((blog) => (
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
                    <p>{blog.content?.slice(0, 100) || ''}...</p>
                    <Link to={`/blog/${blog.id}`} className='btn btn-primary read-more-btn'>
                      Read More <i className="bi bi-arrow-right ms-2"></i>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default BlogSlider;
