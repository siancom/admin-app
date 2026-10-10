/**
 * 📝 Input field with label - used by App.jsx
 */
import React from 'react';

export default function InputField({ label, required, ...props }) {
  return (
    <div>
      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        required={required}
        className={`w-full border-2 border-gray-100 bg-gray-50/50 rounded-xl p-3 outline-none focus:border-blue-400 focus:bg-white transition-all font-medium text-gray-800 ${props.className || ''}`}
        {...props}
      />
    </div>
  );
}