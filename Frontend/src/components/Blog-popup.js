import React, { useState, useEffect } from 'react';
import { addBlog, updateBlog } from '../serviceAPI/userAPI';
import { useToaster } from './Toaster';
import './popup-u.css';

const BlogPopup = ({ isOpen, onClose, fetchApi, initialData }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
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
  const addToast = useToaster();

  useEffect(() => {
    if (initialData) {
      // Handle tags - convert array to string if needed
      let tagsString = '';
      if (initialData.tags) {
        if (Array.isArray(initialData.tags)) {
          tagsString = initialData.tags.join(', ');
        } else if (typeof initialData.tags === 'string') {
          try {
            const parsedTags = JSON.parse(initialData.tags);
            tagsString = Array.isArray(parsedTags) ? parsedTags.join(', ') : initialData.tags;
          } catch {
            tagsString = initialData.tags;
          }
        }
      }

      setFormState({
        title: initialData.title || '',
        content: initialData.content || '',
        image: initialData.image || null,
        author: initialData.author || '',
        category: initialData.category || '',
        tags: tagsString,
        status: initialData.status || 'draft'
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
  }, [initialData]);

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

      if (initialData) {
        await updateBlog(initialData.id, formData);
        addToast('Blog updated successfully', 'success');
      } else {
        await addBlog(formData);
        addToast('Blog created successfully', 'success');
      }
      fetchApi();
      onClose();
    } catch (error) {
      console.error('Error saving blog:', error);
      addToast('Error saving blog', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormState(prev => ({ ...prev, image: file }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="popup-overlay">
      <div className="popup-content">
        <div className='popup-header d-flex justify-content-between align-items-center'>
          <h2>{initialData ? 'Edit Blog' : 'Create Blog'}</h2>
          <span className="close-btn" onClick={onClose}>&times;</span>
        </div>
        <form className="popup-form" onSubmit={handleSubmit}>
          <div className="row">
            <div className="col-md-12 mb-4">
              <label>Title</label>
              <input
                type="text"
                className="form-control"
                value={formState.title}
                onChange={(e) => setFormState(prev => ({ ...prev, title: e.target.value }))}
              />
              {errors.title && <div className="text-danger">{errors.title}</div>}
            </div>

            <div className="col-md-12 mb-4">
              <label>Content</label>
              <textarea
                className="form-control"
                rows="5"
                value={formState.content}
                onChange={(e) => setFormState(prev => ({ ...prev, content: e.target.value }))}
              />
              {errors.content && <div className="text-danger">{errors.content}</div>}
            </div>

            <div className="col-md-6 mb-4">
              <label>Author</label>
              <input
                type="text"
                className="form-control"
                value={formState.author}
                onChange={(e) => setFormState(prev => ({ ...prev, author: e.target.value }))}
              />
              {errors.author && <div className="text-danger">{errors.author}</div>}
            </div>

            <div className="col-md-6 mb-4">
              <label>Category</label>
              <input
                type="text"
                className="form-control"
                value={formState.category}
                onChange={(e) => setFormState(prev => ({ ...prev, category: e.target.value }))}
              />
              {errors.category && <div className="text-danger">{errors.category}</div>}
            </div>

            <div className="col-md-6 mb-4">
              <label>Tags (comma separated)</label>
              <input
                type="text"
                className="form-control"
                value={formState.tags}
                onChange={(e) => setFormState(prev => ({ ...prev, tags: e.target.value }))}
              />
            </div>

            <div className="col-md-6 mb-4">
              <label>Status</label>
              <select
                className="form-select"
                value={formState.status}
                onChange={(e) => setFormState(prev => ({ ...prev, status: e.target.value }))}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>

            <div className="col-md-12 mb-4">
              <label>Featured Image</label>
              <input
                type="file"
                className="form-control"
                accept="image/*"
                onChange={handleFileChange}
              />
              {initialData?.image && (
                <div className="mt-2">
                  <img 
                    src={initialData.image.startsWith('http') ? initialData.image : `${process.env.REACT_APP_BASE_URL}/uploads/${initialData.image}`} 
                    alt="Current featured" 
                    style={{ maxWidth: '200px', maxHeight: '200px' }} 
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="button-group d-flex justify-content-end">
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : initialData ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BlogPopup; 