import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import LandingPage from './components/LandingPage';
import AuthFlow from './components/Auth/AuthFlow';
import RoleSelectionPage from './components/Auth/RoleSelectionPage';
import SidebarLayout from './components/SidebarLayout';
import ClientDashboard from './components/Client/ClientDashboard';
import AIBooks from './components/Client/AIBooks';
import AIWorkbook from './components/Client/AIWorkbook';
import BookDetail from './components/Client/BookDetail';
import WorkbookDetail from './components/Client/WorkbookDetail';
import ChapterDetail from './components/Client/ChapterDetail';
import TopicDetail from './components/Client/TopicDetail';
import SubTopicDetail from './components/Client/SubTopicDetail';
import AssetView from './components/Client/AssetView';
import Datastore from './components/DatastorePage';
import Datastores from './components/Client/DataStore';
import DatastoreItemsList from './components/Client/DatastoreItemsList';
import UserHome from './components/User/UserHome';
import ChatApplication from './components/ChatApplication';
import BookChaptersQRView from './components/Client/BookViewer';
import ChapterViewer from './components/Client/ChapterViewer';
import TopicViewer from './components/Client/TopicViewer';
import SubTopicViewer from './components/Client/SubTopicViewer';
import MobileAssetView from './components/MobileAssetView';
import User from './components/Client/User';
import AISWBPage from './components/Client/AISWBPage';
import AISWBQuestions from './components/Client/AISWBQuestions';
// import AssessmentDashboard from './components/Client/AssessmentDashboard';
import QuestionSubmissions from './components/Client/QuestionSubmissions';
import QRQuestionPage from './components/QRQuestionPage';
import BookCourses from './components/Client/BookCourses';
import AITests from './components/Client/AITests';
import TestDetail from './components/Client/TestDetail';

const UserApp = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const initializeAuth = async () => {
      const token = Cookies.get('usertoken');
      const userCookie = Cookies.get('user');
      if (token) {
        try {
          if (userCookie) {
            const userData = JSON.parse(userCookie);
            setIsAuthenticated(true);
            setUserRole(userData.role);
          }
          const response = await fetch('https://aipbbackend-c5ed.onrender.com/api/auth/validate', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          const data = await response.json();
          if (data.success) {
            setIsAuthenticated(true);
            setUserRole(data.role);
            Cookies.set('user', JSON.stringify({
              role: data.role,
              name: data.name || (userCookie ? JSON.parse(userCookie).name : '')
            }), { expires: 7 });
          } else {
            throw new Error('Invalid token');
          }
        } catch (error) {
          console.error('Error validating token:', error);
          clearAuth();
        }
      } else {
        setIsAuthenticated(false);
        setUserRole(null);
      }
      setIsLoading(false);
    };
    initializeAuth();
  }, []);

  const clearAuth = () => {
    Cookies.remove('usertoken', { path: '/' });
    Cookies.remove('user', { path: '/' });
    setIsAuthenticated(false);
    setUserRole(null);
    setIsLoading(false);
  };

  const handleAuthSuccess = (role) => {
    setIsAuthenticated(true);
    setUserRole(role);
    console.log(`Auth success: role=${role}`);
  };

  const handleLogout = () => {
    clearAuth();
    navigate('/auth');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Routes>

{/* QR Question Access Route - Public */}
<Route path="/question/:questionId" element={<QRQuestionPage />} />

{/* Mobile Asset View Routes - These should be accessible without authentication for QR code scanning */}
<Route path="/mobile-asset-view/:bookId" element={<MobileAssetView />} />
        {/* Public routes - accessible without authentication */}
        <Route path="/book-viewer/:bookId" element={<BookChaptersQRView />} />
        <Route path="/book-viewer/:bookId/chapters/:chapterId" element={<ChapterViewer />} />
        <Route path="/book-viewer/:bookId/chapters/:chapterId/topics/:topicId" element={<TopicViewer />} />
        <Route path="/book-viewer/:bookId/chapters/:chapterId/topics/:topicId/subtopics/:subtopicId" element={<SubTopicViewer />} />
        {/* Mobile Asset View Routes - These should be accessible without authentication for QR code scanning */}
        <Route path="/mobile-asset-view/:bookId" element={<MobileAssetView />} />
        <Route path="/mobile-asset-view/:bookId/chapters/:chapterId" element={<MobileAssetView />} />
        <Route path="/mobile-asset-view/:bookId/chapters/:chapterId/topics/:topicId" element={<MobileAssetView />} />
        <Route path="/mobile-asset-view/:bookId/chapters/:chapterId/topics/:topicId/subtopics/:subtopicId" element={<MobileAssetView />} />
        
        {/* Mobile Asset View Routes for Workbooks */}
        <Route path="/mobile-asset-view/workbooks/:workbookId" element={<MobileAssetView />} />
        <Route path="/mobile-asset-view/workbooks/:workbookId/chapters/:chapterId" element={<MobileAssetView />} />
        <Route path="/mobile-asset-view/workbooks/:workbookId/chapters/:chapterId/topics/:topicId" element={<MobileAssetView />} />
        <Route path="/mobile-asset-view/workbooks/:workbookId/chapters/:chapterId/topics/:topicId/subtopics/:subtopicId" element={<MobileAssetView />} />

        <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LandingPage />} />
        <Route path="/auth" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <AuthFlow onAuthSuccess={handleAuthSuccess} />} />
        
        {/* Protected routes with authentication check */}
        <Route path="/role-selection" element={isAuthenticated || Cookies.get('usertoken') ? <RoleSelectionPage onAuthSuccess={handleAuthSuccess} /> : <Navigate to="/auth" replace />} />
        
        {/* Authentication-required routes */}
        {isAuthenticated ? (
          <Route element={<SidebarLayout onLogout={handleLogout} userRole={userRole} />}>
            <Route path="/dashboard" element={userRole === 'client' ? <ClientDashboard /> : <UserHome />} />
            {userRole === 'client' && (
              <>
                <Route path="/ai-books" element={<AIBooks />} />
                <Route path="/ai-books/:bookId" element={<BookDetail />} />
                <Route path="/ai-books/:bookId/chapters/:chapterId" element={<ChapterDetail />} />
                <Route path="/ai-books/:bookId/chapters/:chapterId/topics/:topicId" element={<TopicDetail />} />
                <Route path="/ai-books/:bookId/chapters/:chapterId/topics/:topicId/subtopics/:subtopicId" element={<SubTopicDetail />} />
                
                {/* AI Workbook Routes */}
                <Route path="/ai-workbook" element={<AIWorkbook />} />
                <Route path="/ai-workbook/:workbookId" element={<WorkbookDetail />} />
                <Route path="/ai-workbook/:workbookId/chapters/:chapterId" element={<ChapterDetail />} />
                <Route path="/ai-workbook/:workbookId/chapters/:chapterId/topics/:topicId" element={<TopicDetail />} />
                <Route path="/ai-workbook/:workbookId/chapters/:chapterId/topics/:topicId/subtopics/:subtopicId" element={<SubTopicDetail />} />
                <Route path="/ai-workbook/:workbookId/datastore" element={<Datastores type="workbook" />} />
                <Route path="/ai-workbook/:workbookId/chapters/:chapterId/datastore" element={<Datastores type="workbook-chapter" />} />
                <Route path="/ai-workbook/:workbookId/chapters/:chapterId/topics/:topicId/datastore" element={<Datastores type="workbook-topic" />} />
                <Route path="/ai-workbook/:workbookId/chapters/:chapterId/topics/:topicId/subtopics/:subtopicId/datastore" element={<Datastores type="workbook-subtopic" />} />
                
                <Route path="/datastore" element={<Datastore />} />
                <Route path="/datastores" element={<Datastores />} />
                <Route path="/datastores/book/:id/items" element={<DatastoreItemsList />} />
                <Route path="/ai-books/:bookId/datastore" element={<Datastores type="book" />} />
                <Route path="/ai-books/:bookId/chapters/:chapterId/datastore" element={<Datastores type="chapter" />} />
                <Route path="/ai-books/:bookId/chapters/:chapterId/topics/:topicId/datastore" element={<Datastores type="topic" />} />
                <Route path="/ai-books/:bookId/chapters/:chapterId/topics/:topicId/subtopics/:subtopicId/datastore" element={<Datastores type="subtopic" />} />
                
                {/* AISWB Routes for AI Books */}
                <Route path="/ai-books/:bookId/chapters/:chapterId/topics/:topicId/aiswb" element={<AISWBPage />} />
                {/* <Route path="/assessment/:topicId/sets/:setId/questions/:questionId" element={<AssessmentDashboard />} /> */}
                <Route path="/aiswb/:topicId/sets/:setId/questions/:questionId" element={<QuestionSubmissions />} />
                
                {/* AISWB Routes for AI Workbooks */}
                <Route path="/ai-workbook/:workbookId/chapters/:chapterId/topics/:topicId/aiswb" element={<AISWBPage />} />

                {/* Asset View Routes for AI Books */}
                <Route path="/ai-books/:bookId/assets" element={<AssetView />} />
                <Route path="/ai-books/:bookId/chapters/:chapterId/assets" element={<AssetView />} />
                <Route path="/ai-books/:bookId/chapters/:chapterId/topics/:topicId/assets" element={<AssetView />} />
                <Route path="/ai-books/:bookId/chapters/:chapterId/topics/:topicId/subtopics/:subtopicId/assets" element={<AssetView />} />
                {/* Book Courses Route */}
                <Route path="/ai-books/:bookId/courses" element={<BookCourses />} />
                
                {/* AI Tests Route */}
                <Route path="/ai-tests" element={<AITests />} />
                <Route path="/ai-tests/:type/:testId" element={<TestDetail/>} />

                
                {/* Asset View Routes for AI Workbooks */}
                <Route path="/ai-workbook/:workbookId/assets" element={<AssetView />} />
                <Route path="/ai-workbook/:workbookId/chapters/:chapterId/assets" element={<AssetView />} />
                <Route path="/ai-workbook/:workbookId/chapters/:chapterId/topics/:topicId/assets" element={<AssetView />} />
                <Route path="/ai-workbook/:workbookId/chapters/:chapterId/topics/:topicId/subtopics/:subtopicId/assets" element={<AssetView />} />
                <Route path="/users" element={<User/>} />
                <Route path="/chat/:id" element={<ChatApplication />} />
              </>
            )}
            {userRole === 'user' && (
              <>
                <Route path="/home" element={<UserHome />} />
              </>
            )}
          </Route>
        ) : (
          // Redirect authenticated routes to auth page, but NOT the public routes which are already defined above
          <Route path="*" element={<Navigate to="/auth" replace />} />
        )}
      </Routes>
    </div>
  );
};

export default UserApp;