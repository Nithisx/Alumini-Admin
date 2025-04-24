/*
File: AddNewsModal.js
This component handles adding new news posts via a modal form.
*/
import React, { useState, useRef } from 'react';

const TOKEN = 'ff33e87bb30f1e7e4c66548b5869a8cbf360bfb9';
const API_URL = 'http://134.209.157.195:8000/news/';
const categories = ['Success Stories','Events','Announcements','Press Release','Updates'];

export default function AddNewsModal({ show, onClose, onSuccess }) {
  const [form, setForm] = useState({ 
    title: '', 
    content: '', 
    category: 'Success Stories', 
    thumbnail: null, 
    featured: false, 
    images: [] 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const titleRef = useRef(null);
  const contentRef = useRef(null);

  const handleChange = e => {
    const { name, value, type, checked, files } = e.target;
    if (type === 'file') {
      if (name === 'thumbnail') {
        const file = files[0];
        setForm(prev => ({ ...prev, thumbnail: file }));
        // Create preview URL for thumbnail
        if (file) {
          setPreviewUrl(URL.createObjectURL(file));
        }
      }
      else if (name === 'images') {
        setForm(prev => ({ ...prev, images: [...prev.images, ...Array.from(files)] }));
      }
    } else if (type === 'checkbox') {
      setForm(prev => ({ ...prev, [name]: checked }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleRemoveImage = idx => {
    setForm(prev => ({ 
      ...prev, 
      images: prev.images.filter((_, i) => i !== idx) 
    }));
  };

  const handleRemoveThumbnail = () => {
    setForm(prev => ({ ...prev, thumbnail: null }));
    setPreviewUrl(null);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const data = new FormData();
      data.append('title', form.title.trim());
      data.append('content', form.content.trim());
      data.append('category', form.category);
      data.append('featured', form.featured);
      if (form.thumbnail) data.append('thumbnail', form.thumbnail);
      
      // Handle multiple images with their captions
      form.images.forEach((img, i) => { 
        data.append(`images[${i}]image`, img); 
        data.append(`images[${i}]caption`, ''); 
      });

      const res = await fetch(API_URL, { 
        method: 'POST', 
        headers: { 'Authorization': `Token ${TOKEN}` }, 
        body: data 
      });
      
      const json = await res.json();
      
      if (!res.ok) {
        throw new Error(json.detail || 'Failed to create post');
      }
      
      // Reset form and notify parent of success with the response data
      setForm({ 
        title: '',
        content: '',
        category: 'Success Stories',
        thumbnail: null,
        featured: false,
        images: [] 
      });
      setPreviewUrl(null);
      onSuccess(json);
    } catch (err) {
      setSubmitError(err.message || 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Close the modal and reset everything
  const handleClose = () => {
    setForm({ 
      title: '',
      content: '',
      category: 'Success Stories',
      thumbnail: null,
      featured: false,
      images: [] 
    });
    setPreviewUrl(null);
    setSubmitError(null);
    onClose();
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-full overflow-y-auto p-6 relative">
        <button 
          onClick={handleClose} 
          className="absolute top-4 right-4 text-gray-600 hover:text-gray-900 text-2xl font-bold"
          aria-label="Close"
        >
          ×
        </button>
        <h2 className="text-xl font-bold mb-4">Post News Event</h2>
        
        {submitError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p>{submitError}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input 
              id="title"
              name="title" 
              ref={titleRef} 
              value={form.title} 
              onChange={handleChange} 
              placeholder="Enter news title" 
              required 
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
            />
          </div>
          
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
            <textarea 
              id="content"
              name="content" 
              ref={contentRef} 
              value={form.content} 
              onChange={handleChange} 
              placeholder="Enter news content" 
              rows={5} 
              required 
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            ></textarea>
          </div>
          
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select 
              id="category"
              name="category" 
              value={form.category} 
              onChange={handleChange} 
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="thumbnail" className="block text-sm font-medium text-gray-700 mb-1">Thumbnail</label>
            <input 
              id="thumbnail"
              type="file" 
              name="thumbnail" 
              onChange={handleChange} 
              accept="image/*" 
              className="w-full p-2 border rounded" 
            />
            
            {previewUrl && (
              <div className="mt-2 relative inline-block">
                <img 
                  src={previewUrl} 
                  alt="Thumbnail preview" 
                  className="h-24 w-auto rounded border" 
                />
                <button 
                  type="button" 
                  onClick={handleRemoveThumbnail} 
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 w-6 h-6 flex items-center justify-center"
                  aria-label="Remove thumbnail"
                >
                  ×
                </button>
              </div>
            )}
          </div>
          
          <div>
            <label htmlFor="images" className="block text-sm font-medium text-gray-700 mb-1">Additional Images</label>
            <input 
              id="images"
              type="file" 
              name="images" 
              onChange={handleChange} 
              accept="image/*" 
              multiple 
              className="w-full p-2 border rounded" 
            />
            
            {form.images.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mt-2">
                {form.images.map((img, i) => (
                  <div key={i} className="relative">
                    <img 
                      src={URL.createObjectURL(img)} 
                      alt={`Upload preview ${i+1}`} 
                      className="h-16 w-16 object-cover rounded border" 
                    />
                    <button 
                      type="button" 
                      onClick={() => handleRemoveImage(i)} 
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 w-5 h-5 flex items-center justify-center text-xs"
                      aria-label={`Remove image ${i+1}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex items-center">
            <input 
              id="featured"
              type="checkbox" 
              name="featured" 
              checked={form.featured} 
              onChange={handleChange} 
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" 
            />
            <label htmlFor="featured" className="ml-2 block text-sm text-gray-900">Featured post</label>
          </div>
          
          <div className="flex justify-end space-x-2 pt-2">
            <button 
              type="button" 
              onClick={handleClose} 
              className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting} 
              className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors ${isSubmitting ? 'opacity-75 cursor-not-allowed' : ''}`}
            >
              {isSubmitting ? 'Submitting...' : 'Post News'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}