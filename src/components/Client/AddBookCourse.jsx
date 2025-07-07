import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Upload } from 'lucide-react';
import { getS3UploadUrl, uploadFileToS3, createCourse, updateCourse } from '../utils/api';
import { useParams } from 'react-router-dom';

const AddBookCourse = ({ isOpen, onClose, onAdd, initialData }) => {
  const { bookId } = useParams();
  const [courseName, setCourseName] = useState('');
  const [overview, setOverview] = useState('');
  const [details, setDetails] = useState('');
  const [faculty, setFaculty] = useState([{ name: '', about: '', imagePreview: '', faculty_imageKey: '', uploading: false }]);
  const [coverImagePreview, setCoverImagePreview] = useState('');
  const [coverImageKey, setCoverImageKey] = useState('');
  const [coverUploading, setCoverUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        console.log('AddBookCourse initialData:', initialData);
        setCourseName(initialData.name || '');
        setOverview(initialData.overview || '');
        setDetails(initialData.details || '');
        setFaculty(
          initialData.faculty && Array.isArray(initialData.faculty) && initialData.faculty.length > 0
            ? initialData.faculty.map(f => {
                console.log('Faculty image params in form:', {
                  faculty_imageUrl: f.faculty_imageUrl,
                  faculty_imageKey: f.faculty_imageKey
                });
                return {
                  name: f.name || '',
                  about: f.about || '',
                  imagePreview: f.faculty_imageUrl ? f.faculty_imageUrl : (f.faculty_imageKey || ''),
                  faculty_imageKey: f.faculty_imageKey || '',
                  uploading: false
                };
              })
            : [{ name: '', about: '', imagePreview: '', faculty_imageKey: '', uploading: false }]
        );
        console.log('Cover image params in form:', {
          cover_imageUrl: initialData.cover_imageUrl,
          cover_imageKey: initialData.cover_imageKey
        });
        setCoverImagePreview(initialData.cover_imageUrl ? initialData.cover_imageUrl : (initialData.cover_imageKey || ''));
        setCoverImageKey(initialData.cover_imageKey || '');
      } else {
        setCourseName('');
        setOverview('');
        setDetails('');
        setFaculty([{ name: '', about: '', imagePreview: '', faculty_imageKey: '', uploading: false }]);
        setCoverImagePreview('');
        setCoverImageKey('');
      }
    }
  }, [isOpen, initialData]);

  const handleFacultyChange = (idx, field, value) => {
    const updated = [...faculty];
    updated[idx][field] = value;
    setFaculty(updated);
  };

  const addFaculty = () => {
    setFaculty([...faculty, { name: '', about: '', imagePreview: '', faculty_imageKey: '', uploading: false }]);
  };

  const removeFaculty = (idx) => {
    setFaculty(faculty.filter((_, i) => i !== idx));
  };

  const handleFacultyImageChange = async (idx, e) => {
    const file = e.target.files[0];
    if (!file) return;
    const updated = [...faculty];
    updated[idx].uploading = true;
    setFaculty(updated);
    try {
      const { uploadUrl, key } = await getS3UploadUrl(file.name, file.type);
      await uploadFileToS3(uploadUrl, file, file.type);
      updated[idx].faculty_imageKey = key;
      updated[idx].imagePreview = URL.createObjectURL(file);
      updated[idx].uploading = false;
      setFaculty([...updated]);
    } catch (err) {
      updated[idx].uploading = false;
      setFaculty([...updated]);
      alert('Failed to upload faculty image: ' + err.message);
    }
  };

  const handleCoverImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCoverUploading(true);
    setCoverImagePreview(URL.createObjectURL(file));
    try {
      const { uploadUrl, key } = await getS3UploadUrl(file.name, file.type);
      await uploadFileToS3(uploadUrl, file, file.type);
      setCoverImageKey(key);
    } catch (err) {
      alert('Failed to upload cover image: ' + err.message);
    } finally {
      setCoverUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Check if any faculty image or cover is still uploading
      if (coverUploading || faculty.some(f => f.uploading)) {
        alert('Please wait for all images to finish uploading.');
        setIsSubmitting(false);
        return;
      }
      // Prepare data
      const data = {
        name: courseName,
        overview,
        details,
        cover_imageKey: coverImageKey || undefined,
        faculty: faculty.filter(f => f.name.trim() || f.about.trim()).map(f => ({
          name: f.name,
          about: f.about,
          faculty_imageKey: f.faculty_imageKey || undefined
        })),
      };
      let response;
      if (initialData && initialData._id) {
        response = await updateCourse(bookId, initialData._id, data);
      } else {
        response = await createCourse(bookId, data);
      }
      console.log('Course API response:', response);
      if (onAdd) onAdd(response);
    } catch (err) {
      console.error('Error submitting course:', err);
      alert('Error: ' + err.message);
    } finally {
      setIsSubmitting(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700" type="button">
          <X size={22} />
        </button>
        <h2 className="text-2xl font-bold mb-6 text-gray-800">{initialData ? 'Edit Course' : 'Add New Course'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2">Course Name</label>
            <input type="text" value={courseName} onChange={e => setCourseName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500" required />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2">Overview</label>
            <textarea value={overview} onChange={e => setOverview(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 h-24" />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2">Details</label>
            <input type="text" value={details} onChange={e => setDetails(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2">Faculty Details</label>
            {faculty.map((facultyMember, idx) => (
              <div key={idx} className="border border-gray-200 rounded-md p-4 mb-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-medium text-gray-600">Faculty Member {idx + 1}</span>
                  {faculty.length > 1 && (
                    <button type="button" onClick={() => removeFaculty(idx)} className="text-red-500 hover:text-red-700">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <input type="text" value={facultyMember.name} onChange={e => handleFacultyChange(idx, 'name', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md mb-2 focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="Name" />
                <input type="text" value={facultyMember.about} onChange={e => handleFacultyChange(idx, 'about', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md mb-2 focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="About" />
                <div className="w-full mb-2">
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-orange-300 rounded-md px-3 py-4 w-full cursor-pointer hover:border-orange-500 transition-colors">
                    <Upload size={24} className="mb-2 text-orange-500" />
                    <span className="text-sm text-gray-600">Click to upload Faculty Image</span>
                    <input type="file" accept="image/*" onChange={e => handleFacultyImageChange(idx, e)} className="hidden" />
                  </label>
                  {facultyMember.uploading && <div className="text-xs text-orange-600 mt-2">Uploading...</div>}
                  {facultyMember.imagePreview && <img src={facultyMember.imagePreview} alt="Faculty Preview" className="w-full max-w-xs h-32 object-cover rounded-md border mt-2 mx-auto" />}
                </div>
              </div>
            ))}
            <button type="button" onClick={addFaculty} className="mt-1 flex items-center text-orange-600 hover:text-orange-800">
              <Plus size={16} className="mr-1" />
              Add Faculty Member
            </button>
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-medium mb-2">Course Cover Image</label>
            <div className="w-full mb-2">
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-orange-300 rounded-md px-3 py-4 w-full cursor-pointer hover:border-orange-500 transition-colors">
                <Upload size={24} className="mb-2 text-orange-500" />
                <span className="text-sm text-gray-600">Click to upload Cover Image</span>
                <input type="file" accept="image/*" onChange={handleCoverImageChange} className="hidden" />
              </label>
              {coverUploading && <div className="text-xs text-orange-600 mt-2">Uploading...</div>}
              {coverImagePreview && <img src={coverImagePreview} alt="Cover Preview" className="w-full max-w-xs h-32 object-cover rounded-md border mt-2 mx-auto" />}
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={isSubmitting || coverUploading || faculty.some(f => f.uploading)} className="px-6 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors flex items-center justify-center">
              {isSubmitting ? <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div> : (initialData ? 'Save Changes' : 'Add Course')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddBookCourse; 