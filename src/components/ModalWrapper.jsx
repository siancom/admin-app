/**
 * 🪟 Modal Wrapper component - shared across App.jsx and App_mobile.tsx
 */
import React from 'react';
import { X } from 'lucide-react';

export default function ModalWrapper({ isOpen, onClose, title, icon: Icon, children, noMaxHeight, maxWidth = "max-w-md", colorClass, zIndex = "z-[150]" }) {
  if (!isOpen) return null;
  return (
    <div className={`fixed inset-0 ${zIndex} flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm`}>
      <div className={`bg-white w-full ${maxWidth} rounded-[32px] p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 ${noMaxHeight ? '' : 'max-h-[90vh] overflow-y-auto'}`}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black text-gray-800 flex items-center">
            {Icon && <div className={`p-2 rounded-xl mr-3 ${colorClass || 'bg-gray-100'}`}><Icon size={20} /></div>}
            {title}
          </h3>
          <button type="button" onClick={onClose} className="p-2 bg-gray-50 rounded-full hover:bg-gray-100"><X size={20}/></button>
        </div>
        {children}
      </div>
    </div>
  );
}