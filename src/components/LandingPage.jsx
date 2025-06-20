import React, { useState, useEffect } from 'react';
import { ChevronDown, Menu, X, Book, MessageCircle, FileText, Users, Smartphone, Brain, Star, Play, Mail, Check, ArrowRight, Zap, Target, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import { FaInstagram, FaFacebookF, FaXTwitter } from "react-icons/fa6";

const AdvancedLandingPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [typewriterText, setTypewriterText] = useState('');
  const [currentTextIndex, setCurrentTextIndex] = useState(0);

  const typewriterTexts = [
    'Transform Education',
    'Empower Learning',
    'Create AI Books',
    'Build Smart Content'
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Typewriter effect
  useEffect(() => {
    let timeout;
    const currentText = typewriterTexts[currentTextIndex];
    
    if (typewriterText.length < currentText.length) {
      timeout = setTimeout(() => {
        setTypewriterText(currentText.slice(0, typewriterText.length + 1));
      }, 100);
    } else {
      timeout = setTimeout(() => {
        setTypewriterText('');
        setCurrentTextIndex((prev) => (prev + 1) % typewriterTexts.length);
      }, 2000);
    }
    
    return () => clearTimeout(timeout);
  }, [typewriterText, currentTextIndex]);

  const features = [
    {
      icon: <Book className="w-8 h-8" />,
      title: "AI Books",
      description: "Create interactive educational books powered by artificial intelligence",
      details: "Have real-time conversations with your books. Ask a question — the AI explains like your favorite teacher would."
    },
    {
      icon: <MessageCircle className="w-8 h-8" />,
      title: "AI Chats & Mentors",
      description: "Engage with AI tutors to enhance learning and answer questions",
      details: "Struggling with a concept? Confused by a topic? Just ask — the AI Book Mentor is here 24/7."
    },
    {
      icon: <FileText className="w-8 h-8" />,
      title: "Assessment Tools",
      description: "Create and manage tests with automatic grading and personalized feedback",
      details: "Practice smarter with AI-generated quizzes and mock tests. Get instant performance feedback and targeted improvement plans."
    },
    {
      icon: <Smartphone className="w-8 h-8" />,
      title: "Mobile Ready",
      description: "Available on Android & iOS",
      details: "Learning on the go? No problem. Access smart books on mobile with interactive, student-friendly design."
    }
  ];

  const audiences = [
    {
      title: "For Publishers",
      color: "bg-cyan-500",
      items: [
        "Digitally upgrade your book catalog",
        "Reach modern learners with smart, interactive content",
        "AI integration without losing your unique voice",
        "Protect copyright while adding immense digital value",
        "Reach new markets with app-based access"
      ]
    },
    {
      title: "For Institutions",
      color: "bg-orange-500",
      items: [
        "Empower your teachers and students with AI-enhanced curriculum",
        "Smart textbooks = Smart results",
        "Plug AI books into your existing LMS or mobile platform",
        "Boost learning outcomes with interactive, test-ready material"
      ]
    },
    {
      title: "For Students & Self-Learners",
      color: "bg-cyan-500",
      items: [
        "Study smarter, not harder. Get a personal AI tutor inside every book",
        "Real-time doubt-solving",
        "Instant revision support",
        "Personalized learning paths & test recommendations"
      ]
    }
  ];

  const testimonials = [
    {
      name: "Dr. Sarah Johnson",
      role: "Education Director",
      content: "AILisher transformed how our students interact with textbooks. The AI tutoring feature is revolutionary.",
      rating: 5
    },
    {
      name: "Michael Chen",
      role: "Publisher",
      content: "Our book sales increased by 300% after integrating with AILisher. The platform is incredible.",
      rating: 5
    },
    {
      name: "Emma Rodriguez",
      role: "Student",
      content: "Having an AI tutor available 24/7 changed my study habits completely. I understand concepts better now.",
      rating: 5
    }
  ];

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    if (email) {
      setIsSubmitted(true);
      setEmail('');
      setTimeout(() => setIsSubmitted(false), 3000);
    }
  };

  return (
    <div className={`min-h-screen transition-all duration-300 ${isDarkMode ? 'dark bg-gray-900' : 'bg-white'}`}>
      {/* Floating Particles Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
        {!isDarkMode && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-cyan-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-500"></div>
        )}
      </div>

      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled 
          ? `backdrop-blur-md ${isDarkMode ? 'bg-gray-900/80' : 'bg-white/80'} shadow-lg` 
          : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center">
                {isDarkMode ? (
                  // Dark mode logo - gradient background with white icon
                  <div className=" from-blue-600 to-purple-600 flex items-center justify-center">
                    <img 
                src="/logowhite.png" 
                 alt="AILisher Logo" 
                  className="h-18 w-18"
                 onError={(e) => {
                   // Fallback if logo fails to load
                   e.target.style.display = 'none';
                   e.target.nextSibling.style.display = 'flex';
                 }}
             />
                  </div>
                ) : (
                  // Light mode logo - white background with gradient icon
                  <div className="w-full h-full flex items-center justify-center">
                    <img 
                src="/logo1.png" 
                  alt="AILisher Logo" 
                  className="h-18 w-18"
                  onError={(e) => {
                    // Fallback if logo fails to load
                    e.target.style.display = 'none';
                   e.target.nextSibling.style.display = 'flex';
                  }}
                />
                </div>
                )}
              </div>
              <span className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Ailisher
              </span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className={`hover:text-blue-600 transition-colors font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Features
              </a>
              <a href="#audiences" className={`hover:text-blue-600 transition-colors font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Solutions
              </a>
              <a href="#testimonials" className={`hover:text-blue-600 transition-colors font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Testimonials
              </a>
              
              {/* Dark Mode Toggle */}
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'bg-gray-700 text-yellow-400' : 'bg-gray-100 text-gray-700'}`}
              >
                {isDarkMode ? '☀️' : '🌙'}
              </button>
              
              <button className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 font-medium">
              <Link
                to="/auth"
              >
                Sign In
              </Link>
              </button>
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-6 h-6 text-white" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className={`md:hidden absolute top-16 left-0 right-0 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white'} shadow-lg`}>
            <div className="px-4 py-6 space-y-4">
               {/* Dark Mode Toggle */}
               <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'bg-gray-700 text-yellow-400' : 'bg-gray-100 text-gray-700'}`}
              >
                {isDarkMode ? '☀️' : '🌙'}
              </button>
              <a href="#features" className="block py-2 text-lg font-medium">Features</a>
              <a href="#audiences" className="block py-2 text-lg font-medium">Solutions</a>
              <a href="#testimonials" className="block py-2 text-lg font-medium">Testimonials</a>
              <button className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full">
              <Link
                to="/auth"
              >
                 Sign In
              </Link>
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 md:pt-32 pb-16 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Animated Logo */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="w-24 h-24  from-blue-600 to-purple-600 rounded-3xl flex items-center justify-center transform hover:scale-110 transition-transform duration-300">
                {isDarkMode ? (
                  // Dark mode logo - gradient background with white icon
                  <div className=" from-blue-600 to-purple-600 flex items-center justify-center">
                    <img 
                src="/logowhitename.png" 
                 alt="AILisher Logo" 
                  className="h-18 w-18"
                 onError={(e) => {
                   // Fallback if logo fails to load
                   e.target.style.display = 'none';
                   e.target.nextSibling.style.display = 'flex';
                 }}
             />
                  </div>
                ) : (
                  // Light mode logo - white background with gradient icon
                  <div className="w-full h-full flex items-center justify-center">
                    <img 
                src="/logoblack.png" 
                alt="AILisher Logo" 
                  className="h-18 w-18"
                onError={(e) => {
                  // Fallback if logo fails to load
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
                  </div>
                )}
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full animate-bounce"></div>
              </div>
            </div>
            
            {/* Main Heading with Typewriter */}
            <h1 className={`text-3xl md:text-4xl lg:text-5xl xl:text-7xl font-extrabold mb-8 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              <span className="block mb-4">
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Convert
                </span> Your Books into
              </span>
              <span className="block mb-4">
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Smart AI Companions
                </span>
              </span>
              <div className="h-20 flex items-center justify-center">
                <span className="text-blue-600 border-blue-600 animate-pulse pr-2">
                  {typewriterText}
                </span>
              </div>
            </h1>

            {/* Key Benefits */}
            <div className="flex flex-wrap justify-center gap-4 mb-12">
              <div className={
                isDarkMode
                  ? "flex items-center space-x-2 bg-green-900/30 border-2 border-green-700 px-4 py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                  : "flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-500 border-2 border-transparent px-4 py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              }>
                <Check className={isDarkMode ? "w-5 h-5 text-green-400" : "w-5 h-5 text-white"} />
                <span className={isDarkMode ? "text-green-300 font-medium" : "text-white font-medium"}>
                  Quick Onboarding for Publishers & Institutions
                </span>
              </div>
              <div className={
                isDarkMode
                  ? "flex items-center space-x-2 bg-blue-900/30 border-2 border-blue-700 px-4 py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                  : "flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-pink-500 border-2 border-transparent px-4 py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              }>
                <Check className={isDarkMode ? "w-5 h-5 text-blue-400" : "w-5 h-5 text-white"} />
                <span className={isDarkMode ? "text-blue-300 font-medium" : "text-white font-medium"}>
                  Custom Branding & Secure Hosting
                </span>
              </div>
              <div className={
                isDarkMode
                  ? "flex items-center space-x-2 bg-blue-900/30 border-2 border-purple-700 px-4 py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                  : "flex items-center space-x-2 bg-gradient-to-r from-cyan-500 to-blue-500 border-2 border-transparent px-4 py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              }>
                <Check className={isDarkMode ? "w-5 h-5 text-purple-400" : "w-5 h-5 text-white"} />
                <span className={isDarkMode ? "text-purple-300 font-medium" : "text-white font-medium"}>
                  Full Mobile App Deployment (Android + iOS)
                </span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full text-lg font-semibold hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-xl">
                <span className="flex items-center space-x-2">
                  <span>Start Free Trial</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
              <button className="group px-8 py-4 border-2 border-blue-600 text-blue-600 rounded-full text-lg font-semibold hover:bg-blue-600 hover:text-white transition-all duration-200">
                <span className="flex items-center space-x-2">
                  <Play className="w-5 h-5" />
                  <span>Watch Demo</span>
                </span>
              </button>
            </div>

            <p className={`mt-8 text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} max-w-3xl mx-auto`}>
              We partner with Publishers and Institutions to bring the power of AI directly into the hands of students and readers worldwide.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className={`py-20 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className={`text-4xl md:text-5xl font-extrabold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              What <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Ailisher</span> Offers
            </h2>
            <p className={`text-xl ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} max-w-3xl mx-auto`}>
              Empowering Books with the Intelligence of AI - Talk. Learn. Analyze. Succeed.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Feature List */}
            <div className="space-y-6">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className={`p-6 rounded-2xl cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                    activeFeature === index
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-2xl'
                      : isDarkMode
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-white text-gray-700 hover:bg-gray-50 shadow-lg'
                  }`}
                  onClick={() => setActiveFeature(index)}
                >
                  <div className="flex items-start space-x-4">
                    <div className={`p-3 rounded-xl ${
                      activeFeature === index 
                        ? 'bg-white/20' 
                        : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                    }`}>
                      {feature.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                      <p className="opacity-90">{feature.description}</p>
                </div>
              </div>
                </div>
              ))}
              </div>

            {/* Feature Details */}
            <div className={`p-8 rounded-3xl ${isDarkMode ? 'bg-gray-700' : 'bg-white'} shadow-2xl`}>
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
                  {features[activeFeature].icon}
                </div>
                <h3 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {features[activeFeature].title}
                </h3>
                <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} leading-relaxed`}>
                  {features[activeFeature].details}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Audiences Section */}
      <section id="audiences" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className={`text-4xl md:text-5xl font-extrabold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Who It's For - <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Solutions by Audience</span>
            </h2>
      </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {audiences.map((audience, index) => (
              <div
                key={index}
                className={`group p-8 rounded-3xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2`}
              >
                <div className={`inline-flex items-center px-4 py-2 rounded-full text-white font-bold text-sm mb-6 ${audience.color}`}>
                  {audience.title}
                </div>
                <ul className="space-y-4">
                  {audience.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start space-x-3">
                      <ArrowRight className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                      <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{item}</span>
                    </li>
                  ))}
                </ul>
            </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className={`py-20 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className={`text-4xl md:text-5xl font-extrabold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              What Our Users Say
            </h2>
            <p className={`text-xl ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Trusted by educators, publishers, and students worldwide
            </p>
      </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className={`group p-8 rounded-3xl ${isDarkMode ? 'bg-gray-700' : 'bg-white'} shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2`}
              >
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className={`text-lg mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} italic`}>
                  "{testimonial.content}"
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div className="ml-4">
                    <h4 className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{testimonial.name}</h4>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className={`p-12 rounded-3xl ${isDarkMode ? 'bg-gray-800' : 'bg-gradient-to-r from-blue-50 to-purple-50'} shadow-2xl`}>
            <Mail className="w-16 h-16 mx-auto mb-6 text-blue-600" />
            <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Stay Updated with AILisher
            </h2>
            <p className={`text-lg mb-8 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Get the latest updates on AI-powered education and exclusive early access to new features.
            </p>
            
            <form onSubmit={handleEmailSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className={`flex-1 px-6 py-3 rounded-full border-2 focus:outline-none focus:border-blue-600 transition-colors ${
                  isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                }`}
                required
              />
              <button
                type="submit"
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-semibold hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200"
              >
                Subscribe
              </button>
            </form>
            
            {isSubmitted && (
              <div className="mt-4 p-4 bg-green-100 dark:bg-green-900/30 rounded-full">
                <p className="text-green-700 dark:text-green-300 font-medium">
                  ✨ Thank you for subscribing! Check your email for confirmation.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-6">
            Ready to Transform Your Books?
          </h2>
          <p className="text-xl mb-10 opacity-90 max-w-3xl mx-auto">
            Join thousands of educators, publishers, and students who are already experiencing the future of interactive learning.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button className="group px-10 py-4 bg-white text-blue-600 rounded-full text-lg font-bold hover:bg-gray-100 transform hover:scale-105 transition-all duration-200 shadow-xl">
              <span className="flex items-center space-x-2">
                <span>Start Your Free Trial</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
            <button className="px-10 py-4 border-2 border-white text-white rounded-full text-lg font-bold hover:bg-white hover:text-blue-600 transition-all duration-200">
              Schedule Demo
            </button>
          </div>
          <p className="mt-6 text-sm opacity-75">
            📧 vijay.w@gmail.com | 📍 B4, D-53, Sector 2, Noida, UP | 📱 +91 8174540362
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className={`py-16 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-800'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Logo and Description */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <img 
                src="/logowhite.png" 
                alt="AILisher Logo" 
                  className="h-10 w-14"
                onError={(e) => {
                  // Fallback if logo fails to load
                  e.target.style.display = 'none';
                   e.target.nextSibling.style.display = 'flex';
                 }}
             />
                </div>
                <span className="text-2xl font-bold text-white">Ailisher</span>
              </div>
              <p className="text-gray-400 mb-6 max-w-md">
                Empowering books with the intelligence of AI. Transform your educational content into interactive, smart learning experiences.
              </p>
              <div className="flex space-x-4">
                 <a href="https://instagram.com/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors">
                  <FaInstagram className="text-white text-xl" />
                </a>
                 <a href="https://facebook.com/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors">
                  <FaFacebookF className="text-white text-xl" />
                </a>
                 <a href="https://x.com/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors">
                  <FaXTwitter className="text-white text-xl" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-white font-bold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><a href="#features" className="text-gray-400 hover:text-white transition-colors">Features</a></li>
                <li><a href="#audiences" className="text-gray-400 hover:text-white transition-colors">Solutions</a></li>
                <li><a href="#testimonials" className="text-gray-400 hover:text-white transition-colors">Testimonials</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Pricing</a></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="text-white font-bold mb-4">Support</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-700 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
                &copy; {new Date().getFullYear()} AILisher. All rights reserved.
              </p>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <span className="text-gray-400 text-sm">Made with ❤️ for Education</span>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating CTA Button */}
      <div className="fixed bottom-8 right-8 z-40">
        <button className="group w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full shadow-2xl hover:shadow-3xl transform hover:scale-110 transition-all duration-300 flex items-center justify-center">
          <MessageCircle className="w-8 h-8 text-white group-hover:animate-bounce" />
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">!</span>
          </div>
        </button>
      </div>

      {/* Scroll to Top Button */}
      {isScrolled && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-8 left-8 z-40 w-12 h-12 bg-gray-800 dark:bg-gray-700 rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300 flex items-center justify-center"
        >
          <ChevronDown className="w-6 h-6 text-white transform rotate-180" />
        </button>
      )}
    </div>
  );
};

export default AdvancedLandingPage;