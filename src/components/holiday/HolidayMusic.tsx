import { useEffect, useRef, useState } from 'react';

interface HolidayMusicProps {
  enabled: boolean;
  volume: number; // 0-100
}

const MUSIC_CHANNEL = 'holiday-music-channel';
const TAB_ID = `tab-${Date.now()}-${Math.random()}`;
const HEARTBEAT_INTERVAL = 3000; // Send heartbeat every 3 seconds
const PLAYBACK_TIMEOUT = 5000; // Consider tab inactive after 5 seconds
const POSITION_STORAGE_KEY = 'holiday-music-position';
const POSITION_SYNC_INTERVAL = 500; // Sync position every 500ms

export default function HolidayMusic({ enabled, volume }: HolidayMusicProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const positionSyncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isActiveTab, setIsActiveTab] = useState(false);
  const [audioReady, setAudioReady] = useState(false);

  // Initialize audio element
  useEffect(() => {
    const audio = new Audio('/assets/app/holiday/ChristmasMusic.mp3');
    audio.loop = true;
    audio.preload = 'auto'; // HTML5 audio automatically streams/chunks large files
    audioRef.current = audio;

    // Wait for metadata to load so we can set start position
    const handleLoadedMetadata = () => {
      try {
        // Try to get stored position from localStorage
        const storedPosition = localStorage.getItem(POSITION_STORAGE_KEY);

        if (storedPosition !== null) {
          // Resume from stored position
          const position = parseFloat(storedPosition);
          if (!isNaN(position) && position >= 0 && position < audio.duration) {
            audio.currentTime = position;
          } else {
            // Invalid stored position, set random start
            audio.currentTime = Math.random() * audio.duration;
            localStorage.setItem(POSITION_STORAGE_KEY, audio.currentTime.toString());
          }
        } else {
          // First time - set random start position
          const randomStart = Math.random() * audio.duration;
          audio.currentTime = randomStart;
          localStorage.setItem(POSITION_STORAGE_KEY, randomStart.toString());
        }
      } catch (error) {
        console.warn('localStorage not available, using random start:', error);
        audio.currentTime = Math.random() * audio.duration;
      }

      setAudioReady(true);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.pause();
      audio.src = '';
    };
  }, []);

  // Set up cross-tab coordination using BroadcastChannel
  useEffect(() => {
    // Check browser support for BroadcastChannel
    if (typeof BroadcastChannel === 'undefined') {
      console.warn('BroadcastChannel not supported, using single-tab fallback');
      setIsActiveTab(true);
      return;
    }

    const channel = new BroadcastChannel(MUSIC_CHANNEL);
    channelRef.current = channel;

    // Handle messages from other tabs
    channel.onmessage = (event) => {
      const { type, tabId, timestamp, position } = event.data;

      if (type === 'HEARTBEAT' && tabId !== TAB_ID) {
        // Another tab is playing music
        const timeSinceHeartbeat = Date.now() - timestamp;
        if (timeSinceHeartbeat < PLAYBACK_TIMEOUT) {
          setIsActiveTab(false);
        }
      } else if (type === 'CLAIM_PLAYBACK' && tabId !== TAB_ID) {
        // Another tab is claiming playback
        setIsActiveTab(false);
      } else if (type === 'RELEASE_PLAYBACK' && tabId !== TAB_ID) {
        // Another tab released playback, we might want to claim it
        // Check if we should become the active tab
        checkAndClaimPlayback();
      } else if (type === 'POSITION_UPDATE' && tabId !== TAB_ID && typeof position === 'number') {
        // Another tab is syncing its position
        const audio = audioRef.current;
        if (audio && audioReady) {
          // Only sync if we're not the active tab and position is significantly different
          const positionDiff = Math.abs(audio.currentTime - position);
          if (!isActiveTab && positionDiff > 1) {
            // More than 1 second difference, sync up
            audio.currentTime = position;
          }
        }
      }
    };

    // Function to check if we should claim playback
    const checkAndClaimPlayback = () => {
      // Try to claim playback after a short delay to avoid race conditions
      setTimeout(() => {
        channel.postMessage({
          type: 'CLAIM_PLAYBACK',
          tabId: TAB_ID,
          timestamp: Date.now(),
        });
        setIsActiveTab(true);
      }, Math.random() * 100); // Random delay 0-100ms to prevent simultaneous claims
    };

    // Initially try to claim playback
    checkAndClaimPlayback();

    return () => {
      // Release playback when tab closes
      channel.postMessage({
        type: 'RELEASE_PLAYBACK',
        tabId: TAB_ID,
        timestamp: Date.now(),
      });
      channel.close();
    };
  }, []);

  // Send heartbeat to other tabs when we're the active tab
  useEffect(() => {
    if (!isActiveTab || !channelRef.current) return;

    const sendHeartbeat = () => {
      const audio = audioRef.current;
      if (audio) {
        channelRef.current?.postMessage({
          type: 'HEARTBEAT',
          tabId: TAB_ID,
          timestamp: Date.now(),
          position: audio.currentTime,
        });
      }
    };

    // Send initial heartbeat
    sendHeartbeat();

    // Set up interval for regular heartbeats
    heartbeatIntervalRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, [isActiveTab]);

  // Sync position to localStorage and other tabs when active
  useEffect(() => {
    if (!isActiveTab || !audioReady) return;

    const syncPosition = () => {
      const audio = audioRef.current;
      if (!audio) return;

      try {
        // Save to localStorage
        localStorage.setItem(POSITION_STORAGE_KEY, audio.currentTime.toString());

        // Broadcast to other tabs
        channelRef.current?.postMessage({
          type: 'POSITION_UPDATE',
          tabId: TAB_ID,
          timestamp: Date.now(),
          position: audio.currentTime,
        });
      } catch (error) {
        // Ignore localStorage errors
      }
    };

    // Sync position regularly
    positionSyncIntervalRef.current = setInterval(syncPosition, POSITION_SYNC_INTERVAL);

    return () => {
      if (positionSyncIntervalRef.current) {
        clearInterval(positionSyncIntervalRef.current);
      }
    };
  }, [isActiveTab, audioReady]);

  // Control playback based on enabled state and active tab status
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioReady) return;

    const shouldPlay = enabled && isActiveTab;

    if (shouldPlay) {
      audio.play().catch((error) => {
        console.error('Error playing holiday music:', error);
        // If autoplay is blocked, we might need user interaction
        // This is handled by browsers' autoplay policies
      });
    } else {
      audio.pause();
    }
  }, [enabled, isActiveTab, audioReady]);

  // Update volume
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Convert 0-100 to 0-1
    audio.volume = Math.max(0, Math.min(1, volume / 100));
  }, [volume]);

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      const audio = audioRef.current;

      if (document.hidden && isActiveTab && channelRef.current && audio) {
        // Tab is hidden, save position and release playback
        try {
          localStorage.setItem(POSITION_STORAGE_KEY, audio.currentTime.toString());
        } catch (error) {
          // Ignore localStorage errors
        }

        channelRef.current.postMessage({
          type: 'RELEASE_PLAYBACK',
          tabId: TAB_ID,
          timestamp: Date.now(),
          position: audio.currentTime,
        });
        setIsActiveTab(false);
      } else if (!document.hidden && enabled && !isActiveTab && audio && audioReady) {
        // Tab became visible, sync to latest position before claiming
        try {
          const storedPosition = localStorage.getItem(POSITION_STORAGE_KEY);
          if (storedPosition !== null) {
            const position = parseFloat(storedPosition);
            if (!isNaN(position) && position >= 0 && position < audio.duration) {
              audio.currentTime = position;
            }
          }
        } catch (error) {
          // Ignore localStorage errors
        }

        // Try to claim playback if enabled
        setTimeout(() => {
          channelRef.current?.postMessage({
            type: 'CLAIM_PLAYBACK',
            tabId: TAB_ID,
            timestamp: Date.now(),
          });
          setIsActiveTab(true);
        }, Math.random() * 100);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isActiveTab, enabled, audioReady]);

  // This component doesn't render anything visible
  return null;
}
