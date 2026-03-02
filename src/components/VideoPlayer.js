import React, { useRef, useEffect, useState, useCallback } from "react";
import Hls from "hls.js";
import { Card, Box, Typography, Slider, IconButton, Stack } from "@mui/material";
import { useGesture } from "@use-gesture/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BrightnessHigh,
  BrightnessLow,
  VolumeUp,
  VolumeDown,
  VolumeOff,
  Forward10,
  Replay10,
  Fullscreen,
  FullscreenExit,
  PlayArrow,
  Pause,
  SkipNext,
  SkipPrevious,
  Settings
} from "@mui/icons-material";

const VideoPlayer = ({ 
  src, 
  title, 
  movieInfo, 
  onVideoEnd,
  currentEpisode,
  onPrevEpisode,
  onNextEpisode 
}) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const hlsRef = useRef(null);
  
  // State quản lý UI
  const [showControls, setShowControls] = useState(true);
  const [brightness, setBrightness] = useState(100);
  const [volume, setVolume] = useState(1);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  // Feedback Indicators
  const [feedback, setFeedback] = useState({ visible: false, type: "", value: "" });
  const [seekAccumulator, setSeekAccumulator] = useState(0);

  // Tự động ẩn Control Center
  const autoHideControls = useCallback(() => {
    setShowControls(true);
    clearTimeout(window.hideTimer);
    window.hideTimer = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  }, [isPlaying]);

  // Xử lý Cử chỉ (Gestures)
  const bind = useGesture(
    {
      onTap: ({ xy: [x, y], tapCount }) => {
        const rect = containerRef.current.getBoundingClientRect();
        const relativeX = x - rect.left;
        const isRightSide = relativeX > rect.width / 2;

        if (tapCount === 1) {
          // 1 Tap: Ẩn/hiện control center
          setShowControls(prev => !prev);
          if (!showControls) autoHideControls();
        } 
        else if (tapCount === 2) {
          // Double Tap: Tua 10s
          const direction = isRightSide ? 1 : -1;
          if (videoRef.current) {
            videoRef.current.currentTime += direction * 10;
            setSeekAccumulator(prev => prev + 10);
            setFeedback({ visible: true, type: isRightSide ? "forward" : "rewind" });
            
            clearTimeout(window.seekTimer);
            window.seekTimer = setTimeout(() => {
              setFeedback(f => ({ ...f, visible: false }));
              setSeekAccumulator(0);
            }, 800);
          }
        }
      },
      onDrag: ({ active, movement: [, my], initial: [ix], direction: [, yDir], last }) => {
        const rect = containerRef.current.getBoundingClientRect();
        const relativeIx = ix - rect.left;
        
        // GIỚI HẠN VÙNG: 15% mép trái hoặc 15% mép phải
        const isLeftZone = relativeIx < rect.width * 0.15;
        const isRightZone = relativeIx > rect.width * 0.85;

        if (active && (isLeftZone || isRightZone)) {
          const delta = -my * 0.005; // Độ nhạy vuốt dọc

          if (isLeftZone) {
            // Brightness
            const newBr = Math.max(20, Math.min(150, brightness + delta * 100));
            setBrightness(newBr);
            setFeedback({ visible: true, type: "brightness", value: `${Math.round(newBr)}%` });
          } else {
            // Volume
            const newVol = Math.max(0, Math.min(1, volume + delta));
            setVolume(newVol);
            if (videoRef.current) videoRef.current.volume = newVol;
            setFeedback({ visible: true, type: "volume", value: `${Math.round(newVol * 100)}%` });
          }
        }
        if (last) {
          setTimeout(() => setFeedback(f => ({ ...f, visible: false })), 500);
        }
      }
    },
    {
      drag: { axis: 'y', threshold: 10, filterTaps: true },
      tap: { threshold: 20 }
    }
  );

  // Logic HLS & Progress (Giữ nguyên các hàm bổ trợ của bạn)
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
    }
    const up = () => {
      setCurrentTime(video.currentTime);
      setDuration(video.duration);
    };
    video.addEventListener("timeupdate", up);
    return () => video.removeEventListener("timeupdate", up);
  }, [src]);

  return (
    <Card sx={{ mt: 2, bgcolor: "#000", color: "white", overflow: "hidden", borderRadius: 2 }}>
      <Box 
        ref={containerRef}
        {...bind()}
        sx={{ 
          position: "relative", width: "100%", aspectRatio: "16/9", 
          touchAction: "none", bgcolor: "black" 
        }}
      >
        <video
          ref={videoRef}
          autoPlay
          style={{ 
            width: "100%", height: "100%", objectFit: "contain",
            filter: `brightness(${brightness}%)`
          }}
        />

        {/* 1. Nút Play/Pause Trung Tâm */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              style={{ position: "absolute", top: "50%", left: "50%", x: "-50%", y: "-50%", zIndex: 10 }}
            >
              <IconButton 
                onClick={(e) => { e.stopPropagation(); isPlaying ? videoRef.current.pause() : videoRef.current.play(); }}
                sx={{ bgcolor: "rgba(0,0,0,0.5)", p: 3, color: "white" }}
              >
                {isPlaying ? <Pause sx={{ fontSize: 60 }} /> : <PlayArrow sx={{ fontSize: 60 }} />}
              </IconButton>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 2. Hiệu ứng Sóng âm Tua phim (Double Tap) */}
        <AnimatePresence>
          {feedback.visible && (feedback.type === "forward" || feedback.type === "rewind") && (
            <motion.div
              key={seekAccumulator}
              initial={{ opacity: 1, scale: 0.8 }}
              animate={{ opacity: 0, scale: 1.5 }}
              style={{
                position: "absolute", top: "50%",
                left: feedback.type === "rewind" ? "25%" : "75%",
                x: "-50%", y: "-50%", zIndex: 5,
                width: 150, height: 150, borderRadius: "50%",
                backgroundColor: "rgba(255,255,255,0.1)",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center"
              }}
            >
              {feedback.type === "forward" ? <Forward10 fontSize="large" /> : <Replay10 fontSize="large" />}
              <Typography variant="h6">+{seekAccumulator}s</Typography>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 3. Indicators (Brightness / Volume) */}
        <AnimatePresence>
          {feedback.visible && (feedback.type === "brightness" || feedback.type === "volume") && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                position: "absolute", top: "15%",
                left: feedback.type === "brightness" ? "10%" : "90%",
                x: "-50%", zIndex: 20,
                bgcolor: "rgba(0,0,0,0.8)", padding: "10px", borderRadius: "12px",
                display: "flex", flexDirection: "column", alignItems: "center",
                border: "1px solid rgba(255,255,255,0.2)", backdropFilter: "blur(4px)"
              }}
            >
              {feedback.type === "brightness" ? <BrightnessHigh /> : <VolumeUp />}
              <Typography variant="caption" sx={{ mt: 1 }}>{feedback.value}</Typography>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 4. Custom Toolbar (Control Center) */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              style={{
                position: "absolute", bottom: 0, left: 0, right: 0,
                background: "linear-gradient(transparent, rgba(0,0,0,0.9))",
                padding: "15px", zIndex: 30
              }}
            >
              <Box sx={{ width: "100%", mb: 1 }}>
                <Slider
                  size="small"
                  value={currentTime}
                  max={duration || 100}
                  onChange={(_, val) => (videoRef.current.currentTime = val)}
                  sx={{ color: "#ff4081", height: 4 }}
                />
              </Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="caption">
                  {Math.floor(currentTime / 60)}:{Math.floor(currentTime % 60).toString().padStart(2, '0')} / 
                  {Math.floor(duration / 60)}:{Math.floor(duration % 60).toString().padStart(2, '0')}
                </Typography>
                <Stack direction="row" spacing={1}>
                  {onPrevEpisode && <IconButton onClick={onPrevEpisode} color="inherit"><SkipPrevious /></IconButton>}
                  {onNextEpisode && <IconButton onClick={onNextEpisode} color="inherit"><SkipNext /></IconButton>}
                  <IconButton onClick={() => containerRef.current.requestFullscreen()} color="inherit"><Fullscreen /></IconButton>
                </Stack>
              </Stack>
            </motion.div>
          )}
        </AnimatePresence>
      </Box>
    </Card>
  );
};

export default VideoPlayer;
