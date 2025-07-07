// utils/api.js
import Cookies from 'js-cookie';

const API_BASE_URL = 'https://aipbbackend-c5ed.onrender.com';

export const apiRequest = async (method, endpoint, data = null) => {
  const token = Cookies.get('usertoken');
  console.log('[apiRequest] Token being used:', token);
  if (!token) {
    console.error('[apiRequest] No token found in cookies!');
    throw new Error('Authentication required');
  }

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  const config = {
    method,
    headers
  };

  if (data) {
    config.body = JSON.stringify(data);
  }

  console.log('[apiRequest] Request:', {
    url: `${API_BASE_URL}${endpoint}`,
    method,
    headers,
    body: data
  });

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    console.log('[apiRequest] Response status:', response.status);

    if (!response.ok) {
      let errorMsg = 'Request failed';
      try {
        const errorData = await response.json();
        errorMsg = errorData.message || errorMsg;
        console.error('[apiRequest] Error response data:', errorData);
        if (errorData.message) {
          console.error('[apiRequest] Error message from API:', errorData.message);
        }
      } catch (e) {
        errorMsg = response.statusText;
      }
      console.error('[apiRequest] Final error message:', errorMsg);
      throw new Error(errorMsg);
    }

    const json = await response.json();
    console.log('[apiRequest] Response JSON:', json);
    return json;
  } catch (error) {
    console.error('[apiRequest] API request failed:', error.message || error);
    throw error;
  }
};

// S3 Upload: Get upload URL and upload file
export const getS3UploadUrl = async (fileName, contentType) => {
  console.log('[getS3UploadUrl] Requesting S3 upload URL for:', { fileName, contentType });
  const res = await apiRequest('POST', '/api/book/upload-url', { fileName, contentType });
  console.log('[getS3UploadUrl] S3 upload URL response:', res);
  if (res.success && res.uploadUrl && res.key) {
    return { uploadUrl: res.uploadUrl, key: res.key };
  } else {
    throw new Error('Invalid response from upload URL API');
  }
};

export const uploadFileToS3 = async (uploadUrl, file, contentType) => {
  console.log('[uploadFileToS3] Uploading file to S3:', { uploadUrl, file, contentType });
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: file,
  });
  console.log('[uploadFileToS3] S3 upload response status:', res.status);
  if (!res.ok) {
    console.error('[uploadFileToS3] S3 upload failed with status:', res.status);
    throw new Error('Failed to upload file to S3');
  }
  console.log('[uploadFileToS3] S3 upload successful');
  return true;
};

// Course CRUD
export const createCourse = async (bookId, data) => {
  console.log('[createCourse] Creating course:', { bookId, data });
  const res = await apiRequest('POST', `/api/book/${bookId}/course`, data);
  console.log('[createCourse] Create course response:', res);
  return res;
};

export const getCourses = async (bookId) => {
  console.log('[getCourses] Fetching courses for book:', bookId);
  console.log(`/api/book/${bookId}/course`);

  const res = await apiRequest('GET', `/api/book/${bookId}/course`);
  console.log('[getCourses] Get courses response:', res);
  // Use res.course (not res.courses)
  return { ...res, course: res.course };
};

export const updateCourse = async (bookId, courseId, data) => {
  console.log('[updateCourse] Updating course:', { bookId, courseId, data });
  const res = await apiRequest('PUT', `/api/book/${bookId}/course/${courseId}`, data);
  console.log(`/api/book/${bookId}/course/${courseId}`);
  console.log('[updateCourse] Update course response:', res);
  return res;
};

export const deleteCourse = async (bookId, courseId) => {
  console.log('[deleteCourse] Deleting course:', { bookId, courseId });
  const res = await apiRequest('DELETE', `/api/book/${bookId}/course/${courseId}`);
  console.log('[deleteCourse] Delete course response:', res);
  return res;
};

// Lecture CRUD
export const createLecture = async (bookId, courseId, data) => {
  console.log('[createLecture] Creating lecture:', { bookId, courseId, data });
  const res = await apiRequest('POST', `/api/book/${bookId}/course/${courseId}/topic`, data);
  console.log('[createLecture] Create lecture response:', res);
  return res;
};

export const getLectures = async (bookId, courseId) => {
  console.log('[getLectures] Fetching lectures:', { bookId, courseId });
  const res = await apiRequest('GET', `/api/book/${bookId}/course/${courseId}/topic`);
  console.log('[getLectures] Get lectures response:', res);
  return res;
};

export const updateLecture = async (bookId, courseId, topicId, data) => {
  console.log('[updateLecture] Updating lecture:', { bookId, courseId, topicId, data });
  const res = await apiRequest('PUT', `/api/book/${bookId}/course/${courseId}/topic/${topicId}`, data);
  console.log('[updateLecture] Update lecture response:', res);
  return res;
};

export const deleteLecture = async (bookId, courseId, topicId) => {
  console.log('[deleteLecture] Deleting lecture:', { bookId, courseId, topicId });
  const res = await apiRequest('DELETE', `/api/book/${bookId}/course/${courseId}/topic/${topicId}`);
  console.log('[deleteLecture] Delete lecture response:', res);
  return res;
};