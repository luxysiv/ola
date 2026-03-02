import React, { useRef, useEffect, useState, useCallback } from "react";
import Hls from "hls.js";
import { Card, Box, Typography, Slider, IconButton } from "@mui/material";
import { saveHistoryItem } from "../utils/history";
import { useGesture } from "@use-gesture/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BrightnessHigh,
  BrightnessLow,
  VolumeUp,
  VolumeDown,
  VolumeOff,
  Forward10,
  Replay10
} from "@mui/icons-material";

const VideoPlayer = ({ src, title, movieInfo, onVideoEnd }) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const hlsRef = useRef(null);
  const hasResumed = useRef(false);
  
  // State cho UI
  const [showControls, setShowControls] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [volume, setVolume] = useState(1);
  const [prevVolume, setPrevVolume] = useState(1);
  const [showSeekIndicator, setShowSeekIndicator] = useState(false);
  const [seekDirection, setSeekDirection] = useState(null);
  const [showVolumeIndicator, setShowVolumeIndicator] = useState(false);
  const [showBrightnessIndicator, setShowBrightnessIndicator] = useState(false);
  const [waveformBars, setWaveformBars] = useState([]);
  const [isMuted, setIsMuted] = useState(false);

  // Tạo waveform animation khi double tap
  const generateWaveform = useCallback(() => {
    const bars = [];
    for (let i = 0; i < 20; i++) {
      bars.push({
        id: i,
        height: Math.random() * 40 + 10,
        delay: i * 0.02,
      });
    }
    setWaveformBars(bars);
    setTimeout(() => setWaveformBars([]), 800);
  }, []);

  // Xử lý double tap để tua
  const handleDoubleTap = (direction) => {
    if (!videoRef.current) return;
    
    const video = videoRef.current;
    const seekTime = direction === 'forward' ? 10 : -10;
    video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + seekTime));
    
    setSeekDirection(direction);
    setShowSeekIndicator(true);
    generateWaveform();
    setTimeout(() => setShowSeekIndicator(false), 800);
  };

  // Xử lý kéo để điều chỉnh brightness/volume
  const bindGestures = useGesture(
    {
      onDrag: ({ movement: [mx, my], first, last, event }) => {
        event.preventDefault();
        const { clientX, clientY } = event;
        const container = containerRef.current;
        if (!container) return;

        const rect = container.getBoundingClientRect();
        const relativeX = clientX - rect.left;
        const width = rect.width;

        // Xác định vùng kéo (trái 20% cho brightness, phải 20% cho volume)
        if (relativeX < width * 0.2) {
          // Điều chỉnh brightness
          const delta = -my / 200; // Giảm khi kéo lên
          const newBrightness = Math.max(20, Math.min(150, brightness + delta * 50));
          setBrightness(newBrightness);
          setShowBrightnessIndicator(true);
          if (last) setTimeout(() => setShowBrightnessIndicator(false), 1000);
        } else if (relativeX > width * 0.8) {
          // Điều chỉnh volume
          const delta = -my / 200;
          let newVolume = Math.max(0, Math.min(1, volume + delta));
          setVolume(newVolume);
          if (videoRef.current) {
            videoRef.current.volume = newVolume;
          }
          setShowVolumeIndicator(true);
          if (last) setTimeout(() => setShowVolumeIndicator(false), 1000);
        }
      },
    },
    {
      drag: {
        filterTaps: true,
        axis: 'y',
        pointer: { touch: true }
      }
    }
  );

  // Xử lý double tap bằng touch events
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let lastTap = 0;
    let tapTimeout;

    const handleTouchEnd = (e) => {
      const currentTime = new Date().getTime();
      const tapLength = currentTime - lastTap;
      
      if (tapLength < 300 && tapLength > 0) {
        // Double tap detected
        e.preventDefault();
        const touch = e.changedTouches[0];
        const rect = video.getBoundingClientRect();
        const touchX = touch.clientX - rect.left;
        
        // Xác định direction dựa trên vị trí tap (trái = lùi, phải = tiến)
        if (touchX < rect.width / 2) {
          handleDoubleTap('backward');
        } else {
          handleDoubleTap('forward');
        }
        
        clearTimeout(tapTimeout);
      }
      
      lastTap = currentTime;
      
      tapTimeout = setTimeout(() => {
        lastTap = 0;
      }, 300);
    };

    video.addEventListener('touchend', handleTouchEnd);
    return () => {
      video.removeEventListener('touchend', handleTouchEnd);
      clearTimeout(tapTimeout);
    };
  }, []);

  // Reset trạng thái resume khi đổi tập
  useEffect(() => {
    hasResumed.current = false;
  }, [src]);

  // Load video stream
  useEffect(() => {
    if (!videoRef.current || !src) return;
    const video = videoRef.current;
    const proxiedUrl = `/proxy-stream?url=${encodeURIComponent(src)}`;

    if (hlsRef.current) hlsRef.current.destroy();

    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(proxiedUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(() => {}));
      hlsRef.current = hls;
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = proxiedUrl;
    }

    return () => {
      if (hlsRef.current) hlsRef.current.destroy();
    };
  }, [src]);

  // Xử lý Resume Time
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !movieInfo?.currentTime || hasResumed.current) return;

    const handleCanPlay = () => {
      if (!hasResumed.current) {
        video.currentTime = movieInfo.currentTime;
        hasResumed.current = true;
      }
    };

    video.addEventListener("loadedmetadata", handleCanPlay);
    return () => video.removeEventListener("loadedmetadata", handleCanPlay);
  }, [src, movieInfo?.currentTime]);

  // Lưu lịch sử mỗi 5s
  useEffect(() => {
    if (!movieInfo) return;
    const interval = setInterval(() => {
      const video = videoRef.current;
      if (video && !video.paused) {
        saveHistoryItem({
          ...movieInfo,
          currentTime: video.currentTime,
          updatedAt: Date.now()
        });
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [movieInfo]);

  // Toggle mute
  const toggleMute = () => {
    if (videoRef.current) {
      if (isMuted) {
        videoRef.current.volume = prevVolume;
        setVolume(prevVolume);
      } else {
        setPrevVolume(volume);
        videoRef.current.volume = 0;
        setVolume(0);
      }
      setIsMuted(!isMuted);
    }
  };

  return (
    <Card sx={{ mt: 2, bgcolor: "#1a1a1a", color: "white" }}>
      {title && (
        <Box sx={{ p: 2 }}>
          <Typography variant="h6">{title}</Typography>
        </Box>
      )}
      <Box 
        ref={containerRef}
        sx={{ 
          width: "100%", 
          maxWidth: 960, 
          margin: "0 auto", 
          bgcolor: "black", 
          aspectRatio: "16/9",
          position: "relative",
          overflow: "hidden",
          cursor: showControls ? "auto" : "none"
        }}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
        onMouseMove={() => setShowControls(true)}
        {...bindGestures()}
      >
        <video
          ref={videoRef}
          controls={false}
          autoPlay
          onEnded={onVideoEnd}
          style={{ 
            width: "100%", 
            height: "100%", 
            objectFit: "contain",
            filter: `brightness(${brightness}%)`
          }}
        />

        {/* Seek Indicator */}
        <AnimatePresence>
          {showSeekIndicator && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                background: "rgba(0,0,0,0.7)",
                borderRadius: "50%",
                width: 100,
                height: 100,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: 24,
                fontWeight: "bold"
              }}
            >
              {seekDirection === 'forward' ? '+10' : '-10'}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Waveform Animation */}
        <AnimatePresence>
          {waveformBars.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: "absolute",
                bottom: "20%",
                left: 0,
                right: 0,
                display: "flex",
                justifyContent: "center",
                alignItems: "flex-end",
                gap: 4,
                height: 60,
                pointerEvents: "none"
              }}
            >
              {waveformBars.map((bar) => (
                <motion.div
                  key={bar.id}
                  initial={{ height: 0 }}
                  animate={{ 
                    height: bar.height,
                    transition: { delay: bar.delay, duration: 0.3 }
                  }}
                  exit={{ height: 0 }}
                  style={{
                    width: 4,
                    backgroundColor: "#ff4081",
                    borderRadius: 2
                  }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Brightness Indicator */}
        <AnimatePresence>
          {showBrightnessIndicator && (
            <motion.div
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -100, opacity: 0 }}
              style={{
                position: "absolute",
                left: 20,
                top: "50%",
                transform: "translateY(-50%)",
                background: "rgba(0,0,0,0.7)",
                borderRadius: 8,
                padding: "12px 8px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8
              }}
            >
              {brightness > 50 ? (
                <BrightnessHigh sx={{ color: "white" }} />
              ) : (
                <BrightnessLow sx={{ color: "white" }} />
              )}
              <Typography variant="caption" sx={{ color: "white" }}>
                {Math.round(brightness)}%
              </Typography>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Volume Indicator */}
        <AnimatePresence>
          {showVolumeIndicator && (
            <motion.div
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 100, opacity: 0 }}
              style={{
                position: "absolute",
                right: 20,
                top: "50%",
                transform: "translateY(-50%)",
                background: "rgba(0,0,0,0.7)",
                borderRadius: 8,
                padding: "12px 8px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8
              }}
            >
              {volume === 0 ? (
                <VolumeOff sx={{ color: "white" }} />
              ) : volume < 0.5 ? (
                <VolumeDown sx={{ color: "white" }} />
              ) : (
                <VolumeUp sx={{ color: "white" }} />
              )}
              <Typography variant="caption" sx={{ color: "white" }}>
                {Math.round(volume * 100)}%
              </Typography>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Custom Controls */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              transition={{ type: "spring", damping: 20 }}
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                background: "linear-gradient(transparent, rgba(0,0,0,0.8))",
                padding: "20px",
                display: "flex",
                alignItems: "center",
                gap: 16
              }}
            >
              <IconButton 
                onClick={() => handleDoubleTap('backward')}
                sx={{ color: "white" }}
              >
                <Replay10 />
              </IconButton>
              
              <IconButton 
                onClick={() => handleDoubleTap('forward')}
                sx={{ color: "white" }}
              >
                <Forward10 />
              </IconButton>

              <IconButton 
                onClick={toggleMute}
                sx={{ color: "white" }}
              >
                {isMuted ? <VolumeOff /> : volume < 0.5 ? <VolumeDown /> : <VolumeUp />}
              </IconButton>

              <Slider
                size="small"
                value={volume}
                onChange={(_, value) => {
                  setVolume(value);
                  if (videoRef.current) {
                    videoRef.current.volume = value;
                  }
                  setIsMuted(value === 0);
                }}
                min={0}
                max={1}
                step={0.01}
                sx={{ 
                  width: 100,
                  color: "white",
                  "& .MuiSlider-track": { bgcolor: "white" },
                  "& .MuiSlider-thumb": { bgcolor: "white" }
                }}
              />

              <Box sx={{ flex: 1 }} />

              <IconButton 
                onClick={() => {
                  const newBrightness = Math.max(20, brightness - 10);
                  setBrightness(newBrightness);
                }}
                sx={{ color: "white" }}
              >
                <BrightnessLow />
              </IconButton>

              <Slider
                size="small"
                value={brightness}
                onChange={(_, value) => setBrightness(value)}
                min={20}
                max={150}
                sx={{ 
                  width: 100,
                  color: "white",
                  "& .MuiSlider-track": { bgcolor: "white" },
                  "& .MuiSlider-thumb": { bgcolor: "white" }
                }}
              />

              <IconButton 
                onClick={() => {
                  const newBrightness = Math.min(150, brightness + 10);
                  setBrightness(newBrightness);
                }}
                sx={{ color: "white" }}
              >
                <BrightnessHigh />
              </IconButton>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Zone Indicators */}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "20%",
            height: "100%",
            pointerEvents: "none",
            borderRight: showControls ? "2px dashed rgba(255,255,255,0.3)" : "none",
            "&::before": {
              content: '"Độ sáng"',
              position: "absolute",
              top: 10,
              left: 10,
              color: "rgba(255,255,255,0.5)",
              fontSize: 12,
              opacity: showControls ? 1 : 0,
              transition: "opacity 0.3s"
            }
          }}
        />

        <Box
          sx={{
            position: "absolute",
            top: 0,
            right: 0,
            width: "20%",
            height: "100%",
            pointerEvents: "none",
            borderLeft: showControls ? "2px dashed rgba(255,255,255,0.3)" : "none",
            "&::before": {
              content: '"Âm lượng"',
              position: "absolute",
              top: 10,
              right: 10,
              color: "rgba(255,255,255,0.5)",
              fontSize: 12,
              opacity: showControls ? 1 : 0,
              transition: "opacity 0.3s"
            }
          }}
        />
      </Box>
    </Card>
  );
};

export default VideoPlayer;
