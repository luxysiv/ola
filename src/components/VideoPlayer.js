import React, { useRef, useEffect, useState, useCallback, useMemo } from "react";
import Hls from "hls.js";
import { Card, Box, Typography, Slider, IconButton } from "@mui/material";
import { useGesture } from "@use-gesture/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BrightnessHigh,
  VolumeUp,
  VolumeDown,
  VolumeOff,
  Fullscreen,
  FullscreenExit,
  PlayArrow,
  Pause,
  SkipNext,
  Settings
} from "@mui/icons-material";

const YT_RED = "#FF0000";

const VideoPlayer = ({ 
  src, 
  title, 
  onVideoEnd,
  currentEpisode,
  onNextEpisode 
}) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const hlsRef = useRef(null);
  const controlsTimeoutRef = useRef(null);
  
  // States
  const [showControls, setShowControls] = useState(true);
  const [brightness, setBrightness] = useState(100);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showSettings, setShowSettings] = useState(false);

  // Indicators
  const [indicator, setIndicator] = useState({ show: false, type: null, value: 0 });

  // 1. Xử lý Play/Pause logic
  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
    }
  }, []);

  // 2. Cấu hình Gestures ổn định
  const bindGestures = useGesture(
    {
      onDrag: ({ xy: [clientX, clientY], movement: [mx, my], first, last, memo }) => {
        const container = containerRef.current;
        if (!container) return;

        // Khởi tạo vùng hoạt động khi bắt đầu kéo
        if (first) {
          const rect = container.getBoundingClientRect();
          const xRel = (clientX - rect.left) / rect.width;
          // memo giúp giữ trạng thái "vùng" suốt quá trình drag
          return { side: xRel < 0.5 ? 'brightness' : 'volume', startVal: xRel < 0.5 ? brightness : volume };
        }

        // Độ nhạy: vuốt 200px = 100% giá trị
        const delta = -my / 200; 

        if (memo.side === 'brightness') {
          const newVal = Math.max(10, Math.min(150, memo.startVal + delta * 100));
          setBrightness(newVal);
          setIndicator({ show: true, type: 'brightness', value: Math.round(newVal) });
        } else {
          const newVal = Math.max(0, Math.min(1, memo.startVal + delta));
          setVolume(newVal);
          if (videoRef.current) videoRef.current.volume = newVal;
          setIndicator({ show: true, type: 'volume', value: Math.round(newVal * 100) });
        }

        if (last) {
          setTimeout(() => setIndicator(prev => ({ ...prev, show: false })), 800);
        }
        return memo;
      },
    },
    { 
      drag: { 
        filterTaps: true, // Không kích hoạt khi chỉ click
        threshold: 15,    // Phải di chuyển > 15px mới tính là vuốt
        axis: 'y'         // Chỉ nhận diện vuốt dọc
      } 
    }
  );

  // 3. HLS & Video Events
  useEffect(() => {
    if (!src || !videoRef.current) return;
    const video = videoRef.current;

    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(src);
      hls.attachMedia(video);
      hlsRef.current = hls;
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
    }

    const handleTime = () => setCurrentTime(video.currentTime);
    const handleMeta = () => setDuration(video.duration);
    const handleState = () => setIsPlaying(!video.paused);

    video.addEventListener('timeupdate', handleTime);
    video.addEventListener('loadedmetadata', handleMeta);
    video.addEventListener('play', handleState);
    video.addEventListener('pause', handleState);

    return () => {
      video.removeEventListener('timeupdate', handleTime);
      video.removeEventListener('loadedmetadata', handleMeta);
      video.removeEventListener('play', handleState);
      video.removeEventListener('pause', handleState);
      if (hlsRef.current) hlsRef.current.destroy();
    };
  }, [src]);

  // 4. Auto-hide controls
  useEffect(() => {
    const hide = () => {
      setShowControls(true);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      if (isPlaying) {
        controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
      }
    };
    containerRef.current?.addEventListener('mousemove', hide);
    return () => clearTimeout(controlsTimeoutRef.current);
  }, [isPlaying]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <Card sx={{ bgcolor: "#000", position: "relative", overflow: "hidden", borderRadius: 0 }}>
      <Box 
        ref={containerRef}
        {...bindGestures()}
        sx={{ 
          width: "100%", aspectRatio: "16/9", position: "relative", 
          cursor: showControls ? "default" : "none", touchAction: "none" 
        }}
      >
        <video
          ref={videoRef}
          onClick={togglePlay}
          style={{ width: "100%", height: "100%", filter: `brightness(${brightness}%)` }}
          playsInline
        />

        {/* Center Indicators (Chỉ hiện khi vuốt Brightness/Volume) */}
        <AnimatePresence>
          {indicator.show && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: "absolute", top: "20%", left: "50%",
                transform: "translateX(-50%)", backgroundColor: "rgba(0,0,0,0.7)",
                padding: "8px 20px", borderRadius: "20px", zIndex: 60,
                display: "flex", alignItems: "center", gap: "10px", color: "white"
              }}
            >
              {indicator.type === 'brightness' ? <BrightnessHigh /> : <VolumeUp />}
              <Typography variant="body1" fontWeight="bold">{indicator.value}%</Typography>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Controls Overlay */}
        <AnimatePresence>
          {showControls && (
            <Box
              component={motion.div}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              sx={{
                position: "absolute", bottom: 0, left: 0, right: 0,
                background: "linear-gradient(transparent, rgba(0,0,0,0.8))",
                p: "0 15px 10px", zIndex: 50
              }}
            >
              {/* YouTube Progress Bar */}
              <Slider
                size="small"
                value={currentTime}
                max={duration || 100}
                onChange={(_, v) => { if(videoRef.current) videoRef.current.currentTime = v; }}
                sx={{
                  color: YT_RED, height: 4, mb: 1,
                  "& .MuiSlider-thumb": { 
                    width: 12, height: 12, 
                    "&:hover, &.Mui-active": { boxShadow: "none" } 
                  },
                  "& .MuiSlider-rail": { opacity: 0.3, color: "#fff" }
                }}
              />

              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <IconButton onClick={togglePlay} sx={{ color: "white" }}>
                  {isPlaying ? <Pause /> : <PlayArrow />}
                </IconButton>

                <IconButton onClick={onNextEpisode} sx={{ color: "white" }}>
                  <SkipNext />
                </IconButton>

                <Box sx={{ display: "flex", alignItems: "center", ml: 1 }}>
                  <IconButton size="small" sx={{ color: "white" }} onClick={() => setIsMuted(!isMuted)}>
                    {isMuted || volume === 0 ? <VolumeOff /> : volume < 0.5 ? <VolumeDown /> : <VolumeUp />}
                  </IconButton>
                  <Typography variant="caption" sx={{ color: "white", ml: 2 }}>
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </Typography>
                </Box>

                <Box sx={{ flexGrow: 1 }} />

                <IconButton sx={{ color: "white" }} onClick={() => setShowSettings(!showSettings)}>
                  <Settings />
                </IconButton>

                <IconButton 
                  sx={{ color: "white" }} 
                  onClick={() => {
                    if (!document.fullscreenElement) containerRef.current.requestFullscreen();
                    else document.exitFullscreen();
                  }}
                >
                  {document.fullscreenElement ? <FullscreenExit /> : <Fullscreen />}
                </IconButton>
              </Box>
            </Box>
          )}
        </AnimatePresence>
      </Box>

      {/* Title block */}
      <Box sx={{ p: 2, bgcolor: "#0f0f0f", color: "white" }}>
        <Typography variant="body1" fontWeight="bold">{title}</Typography>
        <Typography variant="caption" sx={{ opacity: 0.6 }}>{currentEpisode}</Typography>
      </Box>
    </Card>
  );
};

export default VideoPlayer;
