import axios from 'axios';
import React from 'react'
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom'
import Cookies from 'js-cookie';
import { useEffect } from 'react';
import { ArrowLeft, BookOpen, Clock, Target, Award, FileText, CheckCircle, XCircle, AlertCircle, Star, Users, Calendar, Plus, Play, Eye, EyeOff } from 'lucide-react';

export default function TestDetail() {
    const { type, testId } = useParams();
    const navigate = useNavigate();
    const token = Cookies.get('usertoken');

    const [loading, setLoading] = useState(false);
    const [testDetails, setTestDetails] = useState(null);
    const [testInfo, setTestInfo] = useState(null);
    const [activeLevel, setActiveLevel] = useState('L1');
    const [showAnswers, setShowAnswers] = useState(false);
    const [testStarted, setTestStarted] = useState(false);
    const [userAnswers, setUserAnswers] = useState({});
    const [testCompleted, setTestCompleted] = useState(false);

    console.log(type,testId);
    const fetchTestDetails = async () => {
        try {
           setLoading(true);
            const response = await axios.get(`http://localhost:5000/api/${type}test-questions/${testId}`, {
            headers: { Authorization: `Bearer ${token}` }
           }) 
           console.log(response);

           console.log(response.data.questions);
           setTestDetails(response.data.questions);
            
            // Get test information
            const testResponse = await axios.get(`http://localhost:5000/api/${type}tests/${testId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTestInfo(testResponse.data.test);
        } 
        catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchTestDetails();
    }, [testId]);

    const getDifficultyColor = (difficulty) => {
        switch (difficulty) {
            case 'L1':
            case 'level1':
                return 'bg-green-100 text-green-800';
            case 'L2':
            case 'level2':
                return 'bg-yellow-100 text-yellow-800';
            case 'L3':
            case 'level3':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getDifficultyLabel = (difficulty) => {
        switch (difficulty) {
            case 'L1':
            case 'level1':
                return 'Beginner';
            case 'L2':
            case 'level2':
                return 'Intermediate';
            case 'L3':
            case 'level3':
                return 'Advanced';
            default:
                return difficulty;
        }
    };

    // Group questions by difficulty level
    const questionsByLevel = testDetails ? testDetails.reduce((acc, question) => {
        const level = question.difficulty || 'L1';
        if (!acc[level]) {
            acc[level] = [];
        }
        acc[level].push(question);
        return acc;
    }, {}) : {};

    const handleStartTest = () => {
        setTestStarted(true);
        setShowAnswers(false);
        setUserAnswers({});
        setTestCompleted(false);
    };

    const handleAnswerSelect = (questionId, selectedOption) => {
        setUserAnswers(prev => ({
            ...prev,
            [questionId]: selectedOption
        }));
    };

    const handleSubmitTest = () => {
        setTestCompleted(true);
        setShowAnswers(true);
    };

    const handleResetTest = () => {
        setTestStarted(false);
        setShowAnswers(false);
        setUserAnswers({});
        setTestCompleted(false);
    };

    const getLevelQuestions = (level) => {
        return questionsByLevel[level] || [];
    };

    const getTotalQuestions = () => {
        return Object.values(questionsByLevel).reduce((total, questions) => total + questions.length, 0);
    };

    const getAnsweredQuestions = () => {
        return Object.keys(userAnswers).length;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading test details...</p>
                </div>
            </div>
        );
    }

    // If it's not an objective test, show the original view
    if (type !== 'objective') {
        return (
            <div className="min-h-screen bg-gray-50">
                {/* Header */}
                <div className="bg-white shadow-sm border-b border-gray-200 mb-4">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-4">
                                <button
                                    onClick={() => navigate(-1)}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <ArrowLeft size={20} className="text-gray-600" />
                                </button>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">
                                        {testInfo?.name || `${type.charAt(0).toUpperCase() + type.slice(1)} Test`}
                                    </h1>
                                    <p className="text-gray-600 mt-1">
                                        {testDetails?.length || 0} questions • {type.charAt(0).toUpperCase() + type.slice(1)} Type
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center justify-end">
                                {/* Test Overview - Integrated within header */}
                        {testInfo && (
                            <div className=" rounded-xl ">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                                    <div className="flex items-center space-x-3">
                                        <div className="p-3 bg-blue-100 rounded-lg">
                                            <BookOpen size={20} className="text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Category</p>
                                            <p className="text-lg font-semibold text-gray-900">{testInfo.category || 'General'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <div className="p-3 bg-green-100 rounded-lg">
                                            <Clock size={20} className="text-green-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Estimated Time</p>
                                            <p className="text-lg font-semibold text-gray-900">{testInfo.Estimated_time || 'Not specified'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <div className="p-3 bg-purple-100 rounded-lg">
                                            <Target size={20} className="text-purple-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Questions</p>
                                            <p className="text-lg font-semibold text-gray-900">{testDetails?.length || 0}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <div className="p-3 bg-orange-100 rounded-lg">
                                            <Award size={20} className="text-orange-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Type</p>
                                            <p className="text-lg font-semibold text-gray-900">{type.charAt(0).toUpperCase() + type.slice(1)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                            </div>
                        </div>

                        
                    </div>
                </div>

               

                {/* Questions Section */}
                <div className="max-w-7xl ">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                        <div className="px-6 py-4 border-b border-gray-200 flex justify-between">
                            <h2 className="text-lg font-semibold text-gray-900">Questions ({testDetails?.length || 0})</h2>
                            <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center">
                                <Plus size={16} className="mr-2" />
                                Add Question
                            </button>
                        </div>
                        
                        <div className="divide-y divide-gray-200">
                            {testDetails?.map((question, index) => (
                                <div key={question._id} className="p-6">
                                    <div className="flex items-start space-x-4">
                                        {/* Question Number */}
                                        <div className="flex-shrink-0">
                                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                <span className="text-sm font-semibold text-blue-600">{index + 1}</span>
                                            </div>
                                        </div>

                                        {/* Question Content */}
                                        <div className="flex-1 space-y-4">
                                            {/* Question Text */}
    <div>
                                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                                {question.question}
                                            </h3>
                                        </div>

                                        {/* Options for Objective Questions */}
                                        {question.options && question.options.length > 0 && (
                                            <div className="space-y-4">
                                                <div className="flex items-center space-x-2 mb-3">
                                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                    <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Options:</p>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {question.options.map((option, optIndex) => (
                                                        <div
                                                            key={optIndex}
                                                            className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                                                                optIndex === question.correctAnswer
                                                                    ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300 shadow-md'
                                                                    : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                                                            }`}
                                                        >
                                                            <div className="flex items-center space-x-3">
                                                                <span className="text-sm font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                                                    {String.fromCharCode(65 + optIndex)}
                                                                </span>
                                                                <span className="text-gray-900 font-medium">{option}</span>
                                                                {optIndex === question.correctAnswer && (
                                                                    <CheckCircle size={20} className="text-green-600 ml-auto" />
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Answer for Subjective Questions */}
                                        {question.answer && (
                                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                                                <div className="flex items-center space-x-2 mb-3">
                                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                    <p className="text-sm font-semibold text-blue-800 uppercase tracking-wide">Answer:</p>
                                                </div>
                                                <p className="text-blue-900 text-lg leading-relaxed">{question.answer}</p>
                                            </div>
                                        )}

                                        {/* Explanation */}
                                        {question.explanation && (
                                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                                <p className="text-sm font-medium text-yellow-800 mb-2">Explanation:</p>
                                                <p className="text-yellow-900">{question.explanation}</p>
                                            </div>
                                        )}

                                        {/* Question Metadata */}
                                        <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-gray-200">
                                            {/* Difficulty */}
                                            <div className="flex items-center space-x-2">
                                                <Award size={16} className="text-gray-400" />
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(question.difficulty)}`}>
                                                    {getDifficultyLabel(question.difficulty)}
                                                </span>
                                            </div>

                                            {/* Category */}
                                            {question.category && (
                                                <div className="flex items-center space-x-2">
                                                    <FileText size={16} className="text-gray-400" />
                                                    <span className="text-sm text-gray-600">{question.category}</span>
                                                </div>
                                            )}

                                            {/* Subcategory */}
                                            {question.subcategory && (
                                                <div className="flex items-center space-x-2">
                                                    <FileText size={16} className="text-gray-400" />
                                                    <span className="text-sm text-gray-600">{question.subcategory}</span>
                                                </div>
                                            )}

                                            {/* Tags */}
                                            {question.tags && question.tags.length > 0 && (
                                                <div className="flex items-center space-x-2">
                                                    <Star size={16} className="text-gray-400" />
                                                    <div className="flex flex-wrap gap-1">
                                                        {question.tags.map((tag, tagIndex) => (
                                                            <span
                                                                key={tagIndex}
                                                                className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                                                            >
                                                                {tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
        </div>
      ))}
    </div>
                </div>
            </div>

            {/* Empty State */}
            {(!testDetails || testDetails.length === 0) && !loading && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="text-center">
                        <FileText size={48} className="mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Questions Found</h3>
                        <p className="text-gray-600 mb-6">This test doesn't have any questions yet.</p>
                        <button
                            onClick={() => navigate(-1)}
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                            <ArrowLeft size={16} className="mr-2" />
                            Go Back
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
    }

    // Objective test view with level tabs
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b border-gray-200 mb-4">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => navigate(-1)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <ArrowLeft size={20} className="text-gray-600" />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">
                                    {testInfo?.name || 'Objective Test'}
                                </h1>
                                <p className="text-gray-600 mt-1">
                                    {getTotalQuestions()} questions • Objective Type
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center justify-end">
                            {/* Test Overview */}
                            {testInfo && (
                                <div className="rounded-xl">
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                                        <div className="flex items-center space-x-3">
                                            <div className="p-3 bg-blue-100 rounded-lg">
                                                <BookOpen size={20} className="text-blue-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-500">Category</p>
                                                <p className="text-lg font-semibold text-gray-900">{testInfo.category || 'General'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <div className="p-3 bg-green-100 rounded-lg">
                                                <Clock size={20} className="text-green-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-500">Estimated Time</p>
                                                <p className="text-lg font-semibold text-gray-900">{testInfo.Estimated_time || 'Not specified'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <div className="p-3 bg-purple-100 rounded-lg">
                                                <Target size={20} className="text-purple-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-500">Questions</p>
                                                <p className="text-lg font-semibold text-gray-900">{getTotalQuestions()}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <div className="p-3 bg-orange-100 rounded-lg">
                                                <Award size={20} className="text-orange-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-500">Type</p>
                                                <p className="text-lg font-semibold text-gray-900">Objective</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Level Tabs */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
                    <div className="border-b border-gray-200">
                        <div className="flex">
                            {['L1', 'L2', 'L3'].map((level) => (
                                <button
                                    key={level}
                                    onClick={() => setActiveLevel(level)}
                                    className={`flex-1 py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                                        activeLevel === level
                                            ? 'border-blue-500 text-blue-600 bg-blue-50'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    {level === 'L1' ? 'Beginner' : level === 'L2' ? 'Intermediate' : 'Advanced'}
                                    <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                                        {getLevelQuestions(level).length}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content for Active Level */}
                    <div className="p-6">
                        {getLevelQuestions(activeLevel).length === 0 ? (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <FileText size={32} className="text-gray-400" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No Questions Available</h3>
                                <p className="text-gray-600 mb-6">There are no questions for the {activeLevel === 'L1' ? 'Beginner' : activeLevel === 'L2' ? 'Intermediate' : 'Advanced'} level yet.</p>
                            </div>
                        ) : !testStarted ? (
                            // Show start button for this level
                            <div className="text-center py-12">
                                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Play size={32} className="text-blue-600" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    Start {activeLevel === 'L1' ? 'Beginner' : activeLevel === 'L2' ? 'Intermediate' : 'Advanced'} Level Test
                                </h3>
                                <p className="text-gray-600 mb-6">
                                    This level contains {getLevelQuestions(activeLevel).length} questions.
                                </p>
                                <button
                                    onClick={handleStartTest}
                                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center mx-auto"
                                >
                                    <Play size={20} className="mr-2" />
                                    Start {activeLevel === 'L1' ? 'Beginner' : activeLevel === 'L2' ? 'Intermediate' : 'Advanced'} Test
                                </button>
                            </div>
                        ) : (
                            // Show questions for this level
                            <div>
                                {/* Test Progress Bar */}
                                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-gray-700">Progress</span>
                                        <span className="text-sm font-medium text-gray-700">{getAnsweredQuestions()}/{getTotalQuestions()} answered</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div 
                                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${(getAnsweredQuestions() / getTotalQuestions()) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>

                                {/* Questions */}
                                <div className="space-y-6">
                                    {getLevelQuestions(activeLevel).map((question, index) => (
                                        <div key={question._id} className="border border-gray-200 rounded-lg p-6">
                                            <div className="flex items-start space-x-4">
                                                {/* Question Number */}
                                                <div className="flex-shrink-0">
                                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                        <span className="text-sm font-semibold text-blue-600">{index + 1}</span>
                                                    </div>
                                                </div>

                                                {/* Question Content */}
                                                <div className="flex-1 space-y-4">
                                                    {/* Question Text */}
                                                    <div>
                                                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                                                            {question.question}
                                                        </h3>
                                                    </div>

                                                    {/* Options */}
                                                    {question.options && question.options.length > 0 && (
                                                        <div className="space-y-3">
                                                            <div className="flex items-center space-x-2 mb-3">
                                                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                                <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Options:</p>
                                                            </div>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                {question.options.map((option, optIndex) => {
                                                                    const isSelected = userAnswers[question._id] === optIndex;
                                                                    const isCorrect = optIndex === question.correctAnswer;
                                                                    const showCorrectAnswer = showAnswers && isCorrect;
                                                                    const showIncorrectAnswer = showAnswers && isSelected && !isCorrect;

                                                                    return (
                                                                        <div
                                                                            key={optIndex}
                                                                            className={`p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                                                                                isSelected
                                                                                    ? showCorrectAnswer
                                                                                        ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300 shadow-md'
                                                                                        : showIncorrectAnswer
                                                                                        ? 'bg-gradient-to-r from-red-50 to-pink-50 border-red-300 shadow-md'
                                                                                        : 'bg-blue-50 border-blue-300 shadow-md'
                                                                                    : showCorrectAnswer
                                                                                    ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300 shadow-md'
                                                                                    : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                                                                            }`}
                                                                            onClick={() => !testCompleted && handleAnswerSelect(question._id, optIndex)}
                                                                        >
                                                                            <div className="flex items-center space-x-3">
                                                                                <span className={`text-sm font-bold px-2 py-1 rounded-full ${
                                                                                    isSelected
                                                                                        ? 'bg-blue-600 text-white'
                                                                                        : 'bg-gray-100 text-gray-500'
                                                                                }`}>
                                                                                    {String.fromCharCode(65 + optIndex)}
                                                                                </span>
                                                                                <span className={`font-medium ${
                                                                                    isSelected ? 'text-blue-900' : 'text-gray-900'
                                                                                }`}>
                                                                                    {option}
                                                                                </span>
                                                                                {showCorrectAnswer && (
                                                                                    <CheckCircle size={20} className="text-green-600 ml-auto" />
                                                                                )}
                                                                                {showIncorrectAnswer && (
                                                                                    <XCircle size={20} className="text-red-600 ml-auto" />
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Explanation - Only show after test completion */}
                                                    {showAnswers && question.explanation && (
                                                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                                            <p className="text-sm font-medium text-yellow-800 mb-2">Explanation:</p>
                                                            <p className="text-yellow-900">{question.explanation}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Test Action Buttons - Only show when test is started */}
                {testStarted && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <button
                                    onClick={handleResetTest}
                                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                                >
                                    Reset Test
                                </button>
                                <button
                                    onClick={() => setShowAnswers(!showAnswers)}
                                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center"
                                >
                                    {showAnswers ? <EyeOff size={16} className="mr-2" /> : <Eye size={16} className="mr-2" />}
                                    {showAnswers ? 'Hide Answers' : 'Show Answers'}
                                </button>
                            </div>
                            <div className="flex items-center space-x-4">
                                <span className="text-sm text-gray-600">
                                    {getAnsweredQuestions()}/{getTotalQuestions()} questions answered
                                </span>
                                {!testCompleted && (
                                    <button
                                        onClick={handleSubmitTest}
                                        disabled={getAnsweredQuestions() === 0}
                                        className={`px-6 py-2 rounded-md transition-colors flex items-center ${
                                            getAnsweredQuestions() === 0
                                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                : 'bg-green-600 text-white hover:bg-green-700'
                                        }`}
                                    >
                                        <CheckCircle size={16} className="mr-2" />
                                        Submit Test
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Empty State */}
            {(!testDetails || testDetails.length === 0) && !loading && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="text-center">
                        <FileText size={48} className="mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Questions Found</h3>
                        <p className="text-gray-600 mb-6">This test doesn't have any questions yet.</p>
                        <button
                            onClick={() => navigate(-1)}
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                            <ArrowLeft size={16} className="mr-2" />
                            Go Back
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}   
