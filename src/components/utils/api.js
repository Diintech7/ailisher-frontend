// utils/api.js
import Cookies from 'js-cookie';

const API_BASE_URL = 'https://aipbbackend-c5ed.onrender.com'; // Remove /api from here

export const apiRequest = async (method, endpoint, data = null) => {
    const token = Cookies.get('usertoken');
    if (!token) {
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
  
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      
      if (!response.ok) {
        // Try to get error message from response
        let errorMsg = 'Request failed';
        try {
          const errorData = await response.json();
          errorMsg = errorData.message || errorMsg;
        } catch (e) {
          errorMsg = response.statusText;
        }
        throw new Error(errorMsg);
      }
  
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  };