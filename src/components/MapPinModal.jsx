import React, { useState, useEffect, useRef } from 'react';
import { X, MapPin, Navigation } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to handle map clicks for dropping a pin
const MapClickHandler = ({ position, setPosition }) => {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });
  return position === null ? null : (
    <Marker position={position} />
  );
};

// Component to handle flying to user's location
const MapFlyToLocation = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, 16);
    }
  }, [position, map]);
  return null;
};

const MapPinModal = ({ isOpen, onClose, onConfirm, initialLat, initialLng }) => {
  // Default to Thailand center if no initial lat/lng provided
  const defaultPosition = { lat: 13.7563, lng: 100.5018 };
  const [position, setPosition] = useState(
    initialLat && initialLng ? { lat: parseFloat(initialLat), lng: parseFloat(initialLng) } : null
  );
  
  const mapCenter = position || defaultPosition;

  useEffect(() => {
    if (isOpen) {
      setPosition(initialLat && initialLng ? { lat: parseFloat(initialLat), lng: parseFloat(initialLng) } : null);
    }
  }, [isOpen, initialLat, initialLng]);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('อุปกรณ์ของคุณไม่รองรับ GPS');
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      (err) => {
        let errorMsg = 'ไม่สามารถดึงข้อมูลพิกัดได้';
        if (err.code === 1) errorMsg += '\n(เบราว์เซอร์บล็อคเนื่องจากไม่ได้ใช้ HTTPS หรือคุณยังไม่อนุญาต)';
        else if (err.code === 2) errorMsg += '\n(ไม่มีสัญญาณ GPS)';
        else if (err.code === 3) errorMsg += '\n(หมดเวลาในการค้นหาตำแหน่ง)';
        
        alert(`${errorMsg}\nรายละเอียด: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const handleConfirm = () => {
    if (!position) {
      alert('กรุณาปักหมุดตำแหน่งก่อนกดยืนยัน');
      return;
    }
    onConfirm(position.lat, position.lng);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <MapPin size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-800">ปักหมุดที่ตั้งสาขา</h2>
              <p className="text-sm text-gray-500">คลิกบนแผนที่เพื่อเลือกตำแหน่ง</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Map Container */}
        <div className="flex-1 w-full bg-gray-100 relative min-h-[300px]">
          <MapContainer 
            center={mapCenter} 
            zoom={position ? 16 : 6} 
            scrollWheelZoom={true}
            style={{ width: '100%', height: '100%', zIndex: 1 }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapClickHandler position={position} setPosition={setPosition} />
            {position && <MapFlyToLocation position={position} />}
          </MapContainer>
          
          <button 
            onClick={handleGetCurrentLocation}
            className="absolute bottom-6 right-6 z-[2] bg-white text-indigo-600 p-3 rounded-full shadow-lg border border-gray-200 hover:bg-indigo-50 transition-colors"
            title="ดึงพิกัดปัจจุบัน"
          >
            <Navigation size={24} />
          </button>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-gray-100 bg-white flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center shrink-0">
          <div className="text-sm text-gray-500 font-mono flex items-center gap-2">
            <MapPin size={16} className="text-gray-400" />
            {position ? (
              <span>Lat: {position.lat.toFixed(6)}, Lng: {position.lng.toFixed(6)}</span>
            ) : (
              <span>ยังไม่ได้ปักหมุด</span>
            )}
          </div>
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-gray-600 bg-gray-100 hover:bg-gray-200 font-bold transition-colors"
            >
              ยกเลิก
            </button>
            <button 
              onClick={handleConfirm}
              disabled={!position}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 font-bold transition-colors shadow-md"
            >
              ยืนยันตำแหน่ง
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapPinModal;
