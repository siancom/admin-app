import React, { useState, useEffect } from 'react';

export default function LiveTimer({ startTime }) {
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    if (!startTime) return;
    
    const calculateTime = () => {
      const start = new Date(startTime).getTime();
      const now = new Date().getTime();
      const diff = Math.max(0, now - start);
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      if (hours > 0) {
        setElapsed(`${hours} ชม. ${minutes} นาที`);
      } else {
        setElapsed(`${minutes} นาที`);
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 60000); // update every minute
    return () => clearInterval(interval);
  }, [startTime]);

  return <span>{elapsed}</span>;
}
