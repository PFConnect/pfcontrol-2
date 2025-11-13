import { useEffect, useState } from 'react';

export default function HolidayAnimations() {
  const [snowmanPosition, setSnowmanPosition] = useState(-200);
  const [snowmanDirection, setSnowmanDirection] = useState<'in' | 'out'>('in');
  const [showSnowman, setShowSnowman] = useState(true);
  const [sessionStartTime] = useState(Date.now());
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Update current time every second to calculate snow buildup
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Calculate snow height based on time (max 200px after 30 minutes)
  const sessionDuration = (currentTime - sessionStartTime) / 1000; // in seconds
  const maxSnowHeight = 200;
  const maxDuration = 30 * 60; // 30 minutes
  const snowHeight = Math.min((sessionDuration / maxDuration) * maxSnowHeight, maxSnowHeight);

  useEffect(() => {
    // Animate snowman sliding in and out (slower movement)
    const snowmanInterval = setInterval(() => {
      setSnowmanPosition((prev) => {
        if (snowmanDirection === 'in') {
          if (prev >= 20) {
            // Pause at the visible position
            setTimeout(() => setSnowmanDirection('out'), 5000);
            return prev;
          }
          return prev + 0.5; // Slower movement
        } else {
          if (prev <= -200) {
            // Completely off screen, pause before coming back in
            setTimeout(() => {
              setSnowmanDirection('in');
              // Switch between the two snowman styles
              setShowSnowman((prev) => !prev);
            }, 3000);
            return prev;
          }
          return prev - 0.5; // Slower movement
        }
      });
    }, 30);

    return () => clearInterval(snowmanInterval);
  }, [snowmanDirection]);

  return (
    <>
      {/* Progressive snow buildup at bottom - SVG Snow Drift */}
      {/* Z-Index: 1 - Holiday effects layer, above body background (see Z_INDEX_GUIDE.md) */}
      <svg
        className="fixed bottom-0 left-0 right-0 pointer-events-none transition-all duration-1000"
        style={{
          height: `${snowHeight}px`,
          zIndex: 1,
        }}
        viewBox="0 0 1000 200"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="snowGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: 'rgba(255, 255, 255, 0)', stopOpacity: 0 }} />
            <stop offset="30%" style={{ stopColor: 'rgba(255, 255, 255, 0.3)', stopOpacity: 0.3 }} />
            <stop offset="60%" style={{ stopColor: 'rgba(255, 255, 255, 0.7)', stopOpacity: 0.7 }} />
            <stop offset="100%" style={{ stopColor: 'rgba(255, 255, 255, 0.95)', stopOpacity: 0.95 }} />
          </linearGradient>
        </defs>

        {/* Wavy snow drift shape */}
        <path
          d="M 0 200
             Q 50 180, 100 185
             Q 150 190, 200 180
             Q 250 170, 300 175
             Q 350 180, 400 170
             Q 450 160, 500 165
             Q 550 170, 600 160
             Q 650 150, 700 155
             Q 750 160, 800 150
             Q 850 140, 900 145
             Q 950 150, 1000 140
             L 1000 200
             L 0 200 Z"
          fill="url(#snowGradient)"
        />

        {/* Additional snow mounds for depth */}
        <ellipse cx="200" cy="195" rx="80" ry="15" fill="rgba(255, 255, 255, 0.9)" opacity="0.8" />
        <ellipse cx="500" cy="192" rx="100" ry="18" fill="rgba(255, 255, 255, 0.9)" opacity="0.8" />
        <ellipse cx="800" cy="193" rx="90" ry="16" fill="rgba(255, 255, 255, 0.9)" opacity="0.8" />
      </svg>

      {/* Snowman sliding on snow drift */}
      {/* Z-Index: 1 - Holiday effects layer, above body background (see Z_INDEX_GUIDE.md) */}
      <div
        className="fixed bottom-0 pointer-events-none transition-all duration-300"
        style={{
          left: `${snowmanPosition}px`,
          zIndex: 1,
          transform: `translateY(-${Math.max(0, snowHeight - 50)}px)`,
        }}
      >
        {/* SVG Snow drift under snowman */}
        <svg
          className="absolute bottom-0"
          style={{
            width: '250px',
            height: '80px',
            transform: 'translateY(40px)',
            zIndex: 1,
          }}
          viewBox="0 0 250 80"
          preserveAspectRatio="none"
        >
          <defs>
            <radialGradient id="snowmanDriftGradient" cx="50%" cy="30%">
              <stop offset="0%" style={{ stopColor: 'rgba(255, 255, 255, 0.98)', stopOpacity: 0.98 }} />
              <stop offset="50%" style={{ stopColor: 'rgba(255, 255, 255, 0.85)', stopOpacity: 0.85 }} />
              <stop offset="100%" style={{ stopColor: 'rgba(255, 255, 255, 0)', stopOpacity: 0 }} />
            </radialGradient>
          </defs>
          {/* Main drift mound */}
          <ellipse cx="125" cy="60" rx="120" ry="40" fill="url(#snowmanDriftGradient)" />
          {/* Extra texture mounds */}
          <ellipse cx="80" cy="65" rx="60" ry="25" fill="rgba(255, 255, 255, 0.6)" opacity="0.5" />
          <ellipse cx="170" cy="67" rx="55" ry="22" fill="rgba(255, 255, 255, 0.6)" opacity="0.5" />
        </svg>

        {/* Snowman SVG */}
        {showSnowman ? (
          <img
            src="/assets/app/holiday/SnowmanHappy.svg"
            alt="Happy Snowman"
            style={{
              width: '120px',
              height: 'auto',
              filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))',
            }}
          />
        ) : (
          <img
            src="/assets/app/holiday/SnowmanOK.svg"
            alt="OK Snowman"
            style={{
              width: '120px',
              height: 'auto',
              filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))',
            }}
          />
        )}
      </div>
    </>
  );
}
