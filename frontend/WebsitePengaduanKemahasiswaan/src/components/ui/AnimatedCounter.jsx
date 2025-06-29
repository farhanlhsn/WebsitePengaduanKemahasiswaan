import React, { useState, useEffect } from 'react';
import { Typography } from '@mui/material';

const AnimatedCounter = ({ 
  end, 
  duration = 2000, 
  start = 0, 
  prefix = '', 
  suffix = '',
  ...props 
}) => {
  const [count, setCount] = useState(start);

  useEffect(() => {
    let startTime;
    let animationFrame;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentCount = Math.floor(start + (end - start) * easeOutQuart);
      
      setCount(currentCount);
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [end, duration, start]);

  return (
    <Typography {...props}>
      {prefix}{count.toLocaleString()}{suffix}
    </Typography>
  );
};

export default AnimatedCounter;