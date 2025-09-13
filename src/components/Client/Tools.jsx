import React, { useState, useEffect } from "react";
import {
  Megaphone,
  Video,
  MessageCircle,
  Bot,
  MessageSquare,
  Send,
  Image,
  List,
  CreditCard,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Tools() {
  const [activeTab, setActiveTab] = useState("tools");

  const navigate = useNavigate();

  // Handle navigation when activeTab changes
  useEffect(() => {
    if (activeTab === "reels") {
      navigate("/reels");
    } else if (activeTab === "marketing") {
      navigate("/marketing");
    } else if (activeTab === "image-generator") {
      navigate("/image-generator");
    } else if (activeTab === 'category-management') {
      navigate("/category-management")
    }
    // else if (activeTab === 'plan') {
    //   navigate("/plans")
    // }
     
  }, [activeTab, navigate]);

  const tools = [
    {
      id: "marketing",
      title: "Marketing",
      icon: Megaphone,
      color: "bg-blue-500",
      description: "Create campaigns and track performance",
    },
    {
      id: "reels",
      title: "Reels",
      icon: Video,
      color: "bg-purple-500",
      description: "Create and manage video content",
    },
    {
      id: "chats",
      title: "Chats",
      icon: MessageCircle,
      color: "bg-green-500",
      description: "Manage customer conversations",
    },
    {
      id: "ai-agents",
      title: "AI Agents",
      icon: Bot,
      color: "bg-orange-500",
      description: "Automate customer support",
    },
    {
      id: "whatsapp",
      title: "WhatsApp",
      icon: MessageSquare,
      color: "bg-green-600",
      description: "WhatsApp Business integration",
    },
    {
      id: "telegram",
      title: "Telegram",
      icon: Send,
      color: "bg-blue-600",
      description: "Telegram bot management",
    },
    {
      id: "image-generator",
      title: "Image Generator",
      icon: Image,
      color: "bg-blue-600",
      description: "Image generator",
    },
    {
      id: "category-management",
      title: "Category Management",
      icon: List,
      color: "bg-red-500",
      description: "Category management",
    },
    // {
    //   id: "plan",
    //   title: "Plan",
    //   icon: CreditCard,
    //   color: "bg-pink-500",
    //   description: "Plan",
    // },
  ];

  const renderToolsGrid = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      {tools.map((tool) => (
        <div
          key={tool.id}
          onClick={() => setActiveTab(tool.id)}
          className={`${tool.color} p-6 rounded-lg cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-lg text-white`}
        >
          <div className="flex items-center space-x-4">
            <tool.icon className="w-8 h-8" />
            <div>
              <h3 className="text-xl font-bold">{tool.title}</h3>
              <p className="text-sm opacity-90">{tool.description}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "chats":
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Chat Management
            </h2>
            <p className="text-gray-600">
              Chat management and customer conversation tools coming soon...
            </p>
          </div>
        );
      case "ai-agents":
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">AI Agents</h2>
            <p className="text-gray-600">
              AI agent configuration and automation tools coming soon...
            </p>
          </div>
        );
      case "whatsapp":
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              WhatsApp Integration
            </h2>
            <p className="text-gray-600">
              WhatsApp Business API integration and management coming soon...
            </p>
          </div>
        );
      case "telegram":
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Telegram Bot
            </h2>
            <p className="text-gray-600">
              Telegram bot configuration and management coming soon...
            </p>
          </div>
        );
      default:
        return renderToolsGrid();
    }
  };

  return (
    <>
      <div className="m-2">
        <h1 className="text-3xl font-bold text-gray-800">Tools</h1>
        <p className="text-gray-600">Manage your collection of Tools</p>
      </div>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        {activeTab !== "tools" && (
          <div className="bg-white shadow-sm border-b">
            <div className="flex items-center space-x-4 p-4">
              <button
                onClick={() => setActiveTab("tools")}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                ← Back to Tools
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        {renderContent()}
      </div>
    </>
  );
}
