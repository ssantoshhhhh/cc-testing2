import { useRef, useState, useEffect } from 'react';

const useOrderNotifications = () => {
  const confirmedAudioRef = useRef(null);
  const rejectedAudioRef = useRef(null);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [showUnlockBanner, setShowUnlockBanner] = useState(false);

  // Try to unlock audio automatically on mount
  useEffect(() => {
    const enableAudio = async () => {
      try {
        if (confirmedAudioRef.current) {
          await confirmedAudioRef.current.play();
          confirmedAudioRef.current.pause();
          confirmedAudioRef.current.currentTime = 0;
          setAudioUnlocked(true);
          setShowUnlockBanner(false);
        }
      } catch (error) {
        // If autoplay fails, show the unlock banner
        setAudioUnlocked(false);
        setShowUnlockBanner(true);
      }
    };
    enableAudio();
  }, []);

  // Handler to unlock audio (fallback for browsers that block autoplay)
  const handleUnlockAudio = () => {
    if (confirmedAudioRef.current) {
      confirmedAudioRef.current.play().then(() => {
        confirmedAudioRef.current.pause();
        confirmedAudioRef.current.currentTime = 0;
        setAudioUnlocked(true);
        setShowUnlockBanner(false);
      }).catch(() => {
        setAudioUnlocked(false);
        setShowUnlockBanner(true);
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