import { useRef, useState, useEffect } from 'react';

const useOrderNotifications = () => {
  const confirmedAudioRef = useRef(null);
  const rejectedAudioRef = useRef(null);
  const [audioUnlocked, setAudioUnlocked] = useState(() => {
    const saved = localStorage.getItem('userAudioUnlocked');
    return saved !== null ? JSON.parse(saved) : true; // Default to true
  });
  const [showUnlockBanner, setShowUnlockBanner] = useState(() => {
    const saved = localStorage.getItem('userAudioUnlocked');
    return saved === null ? false : !JSON.parse(saved); // Show banner only if not saved or explicitly disabled
  });

  // Try to unlock audio automatically on mount
  useEffect(() => {
    const enableAudio = async () => {
      try {
        if (confirmedAudioRef.current) {
          // Try to play a silent audio to unlock audio context
          confirmedAudioRef.current.volume = 0;
          await confirmedAudioRef.current.play();
          confirmedAudioRef.current.pause();
          confirmedAudioRef.current.currentTime = 0;
          
          // Only update state if we don't have a saved preference or if it was enabled
          const saved = localStorage.getItem('userAudioUnlocked');
          if (saved === null || JSON.parse(saved)) {
            setAudioUnlocked(true);
            setShowUnlockBanner(false);
            localStorage.setItem('userAudioUnlocked', 'true');
          }
        }
      } catch (error) {
        // If autoplay fails, try again after a short delay
        setTimeout(() => {
          if (confirmedAudioRef.current) {
            confirmedAudioRef.current.volume = 0;
            confirmedAudioRef.current.play().then(() => {
              confirmedAudioRef.current.pause();
              confirmedAudioRef.current.currentTime = 0;
              
              // Only update state if we don't have a saved preference or if it was enabled
              const saved = localStorage.getItem('userAudioUnlocked');
              if (saved === null || JSON.parse(saved)) {
                setAudioUnlocked(true);
                setShowUnlockBanner(false);
                localStorage.setItem('userAudioUnlocked', 'true');
              }
            }).catch(() => {
              // Only show banner if we don't have a saved preference
              const saved = localStorage.getItem('userAudioUnlocked');
              if (saved === null) {
                setAudioUnlocked(false);
                setShowUnlockBanner(true);
                localStorage.setItem('userAudioUnlocked', 'false');
              }
            });
          }
        }, 1000);
      }
    };
    
    // Try to unlock audio after a short delay to allow page to load
    const timer = setTimeout(enableAudio, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Handler to unlock audio (fallback for browsers that block autoplay)
  const handleUnlockAudio = () => {
    if (confirmedAudioRef.current) {
      confirmedAudioRef.current.volume = 0;
      confirmedAudioRef.current.play().then(() => {
        confirmedAudioRef.current.pause();
        confirmedAudioRef.current.currentTime = 0;
        setAudioUnlocked(true);
        setShowUnlockBanner(false);
        localStorage.setItem('userAudioUnlocked', 'true');
      }).catch(() => {
        setAudioUnlocked(false);
        setShowUnlockBanner(true);
        localStorage.setItem('userAudioUnlocked', 'false');
      });
    }
  };

  // Play sound based on order status change
  const playOrderStatusSound = (newStatus, previousStatus) => {
    if (!audioUnlocked) return;
    if (newStatus === 'confirmed' && previousStatus === 'pending') {
      if (confirmedAudioRef.current) {
        confirmedAudioRef.current.currentTime = 0;
        confirmedAudioRef.current.play().catch(console.error);
      }
    } else if (newStatus === 'cancelled' && previousStatus !== 'cancelled') {
      if (rejectedAudioRef.current) {
        rejectedAudioRef.current.currentTime = 0;
        rejectedAudioRef.current.play().catch(console.error);
      }
    }
  };

  return {
    confirmedAudioRef,
    rejectedAudioRef,
    audioUnlocked,
    showUnlockBanner,
    handleUnlockAudio,
    playOrderStatusSound
  };
};

export default useOrderNotifications; 