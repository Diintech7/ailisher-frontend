import axios from 'axios';

const BASE_URL = 'https://aipbbackend.onrender.com/api/clients/CLI677117YN7N/mobile';

export const userAnswerService = {
  // Get all answers for a question
  getQuestionAnswers: async (questionId, params = {}) => {
    try {
      // Ensure questionId is valid
      if (!questionId) {
        throw new Error('Question ID is required');
      }

      // Construct URL with proper encoding
      const url = new URL(`${BASE_URL}/userAnswers/crud/answers`);
      
      // Add query parameters
      const queryParams = {
        questionId,
        page: params.page || 1,
        limit: params.limit || 10,
        status: params.status,
        reviewStatus: params.reviewStatus,
        evaluationStatus: params.evaluationStatus,
        sortBy: params.sortBy || 'submittedAt',
        sortOrder: params.sortOrder || 'desc'
      };

      // Remove undefined parameters
      Object.keys(queryParams).forEach(key => 
        queryParams[key] === undefined && delete queryParams[key]
      );

      console.log('Making request to:', url.toString());
      console.log('With params:', queryParams);

      const response = await axios.get(url.toString(), { params: queryParams });
      
      // Log the response data structure
      console.log('API Response:', {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data
      });

      // Log specific data fields if they exist
      if (response.data) {
        console.log('Response Data Details:', {
          totalAnswers: response.data.totalAnswers,
          currentPage: response.data.currentPage,
          totalPages: response.data.totalPages,
          answers: response.data.answers?.length,
          firstAnswer: response.data.answers?.[0]
        });
      }

      return response.data;
    } catch (error) {
      console.error('API Error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url,
        headers: error.response?.headers
      });
      throw error;
    }
  },

  // Get specific answer details
  getAnswerDetails: async (answerId) => {
    try {
      const response = await axios.get(`${BASE_URL}/userAnswers/crud/answers/${answerId}`);
      console.log('Answer Details Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Answer Details Error:', error.response?.data);
      throw error;
    }
  },

  // Update main status
  updateMainStatus: async (answerId, statusData) => {
    try {
      const response = await axios.put(`${BASE_URL}/answers/${answerId}/status`, statusData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update review status
  updateReviewStatus: async (answerId, reviewStatus, reason) => {
    try {
      const response = await axios.put(`${BASE_URL}/userAnswers/crud/answers/${answerId}/review-status`, {
        reviewStatus,
        reason
      });
      console.log('Review Status Update Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Review Status Update Error:', error.response?.data);
      throw error;
    }
  },

  // Update evaluation status and data
  updateEvaluation: async (answerId, evaluationData) => {
    try {
      const response = await axios.put(`${BASE_URL}/userAnswers/crud/answers/${answerId}/evaluation`, evaluationData);
      console.log('Evaluation Update Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Evaluation Update Error:', error.response?.data);
      throw error;
    }
  },

  // Update popularity status
  updatePopularity: async (answerId, popularityStatus, reason) => {
    try {
      console.log('Making popularity update request to:', `${BASE_URL}/userAnswers/crud/answers/${answerId}/status`);
      console.log('Request payload:', {
        popularityStatus,
        reason
      });

      const response = await axios.put(`${BASE_URL}/userAnswers/crud/answers/${answerId}/status`, {
        popularityStatus,
        reason
      });

      console.log('Popularity update response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Popularity update error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url,
        headers: error.response?.headers
      });
      throw error.response?.data || error.message;
    }
  },

  // Get status history
  getStatusHistory: async (answerId) => {
    try {
      const response = await axios.get(`${BASE_URL}/userAnswers/crud/answers/${answerId}/status-history`);
      console.log('Status History Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Status History Error:', error.response?.data);
      throw error;
    }
  },

  // Get question statistics
  getQuestionStatistics: async (questionId) => {
    try {
      const response = await axios.get(`${BASE_URL}/questions/${questionId}/statistics`);
      console.log('Question Statistics Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Question Statistics Error:', error.response?.data);
      throw error;
    }
  },

  // Bulk status update
  bulkStatusUpdate: async (answerIds, statusType, status, reason) => {
    try {
      const response = await axios.post(`${BASE_URL}/userAnswers/crud/answers/bulk-status-update`, {
        answerIds,
        statusType,
        status,
        reason
      });
      console.log('Bulk Status Update Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Bulk Status Update Error:', error.response?.data);
      throw error;
    }
  },

  // New function to publish an answer using the specific URL
  publishAnswer: async (answerId) => {
    try {
      const response = await axios.put(`${BASE_URL}/userAnswers/crud/answers/${answerId}/publish`, {
        publishStatus: "published",
        reason: "Answer meets all quality standards"
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
}; 