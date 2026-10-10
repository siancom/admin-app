/**
 * 📋 Sidebar navigation item - used by App.jsx
 */
import React from 'react';

export default function SidebarItem({ activeTab, setActiveTab, setSidebarOpen, id, icon: Icon, label, badge, onClick }) {
  return (
    <button
      onClick={() => { if (onClick) { onClick(); } else { setActiveTab(id); } if (window.innerWidth < 1024) setSidebarOpen(false); }}
      className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition-all duration-300 relative ${activeTab === id ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg scale-[1.02]' : 'text-gray-500 hover:bg-gray-50 font-medium'}`}
    >
      <Icon size={20} className={activeTab === id ? 'text-white' : 'text-gray-400'} />
      <span className="tracking-wide text-left flex-1">{String(label)}</span>
      {badge !== undefined && Number(badge) > 0 && (
        <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-md animate-pulse">
          {Number(badge)}
        </span>
      )}
    </button>
  );
}