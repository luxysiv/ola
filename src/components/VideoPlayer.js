import React, { useRef, useEffect, useState } from "react";
import Hls from "hls.js";
import { useGesture } from "@use-gesture/react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Box, Typography, IconButton, LinearProgress, Stack 
} from "@mui/material";
import { 
  FastForward, FastRewind, Brightness6, VolumeUp, 
  PlayArrow, Pause, Fullscreen 
} from "@mui/icons-material";

const VideoPlayer = ({ src, title, movieInfo, onVideoEnd }) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const hlsRef = useRef(null);
  
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [showToolbar, setShowToolbar] = useState(true);
  
  // Feedback state
  const [feedback, setFeedback] = useState({ visible: false, type: "", value: "", side: "" });
  const [seekValue, setSeekValue] = useState(0);

  // 1. Logic ẩn hiện Toolbar
  const triggerToolbar = () => {
    setShowToolbar(true);
    clearTimeout(window.hideTimer);
    window.hideTimer = setTimeout(() => setShowToolbar(false), 3000);
  };

  const togglePlay = (e) => {
    if (e) e.stopPropagation();
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  // 2. Sử dụng Use-Gesture
  const bind = useGesture({
    onTap: ({ event, tapCount, xy: [x, y] }) => {
      const rect = containerRef.current.getBoundingClientRect();
      const isRight = (x - rect.left) > rect.width / 2;

      if (tapCount === 1) {
        // Single tap: Hiện/Ẩn toolbar
        setShowToolbar(!showToolbar);
        if (!showToolbar) triggerToolbar();
      } 
      else if (tapCount >= 2) {
        // Multi-tap: Tua 10s mỗi lần chạm
        const direction = isRight ? 1 : -1;
        videoRef.current.currentTime += direction * 10;
        
        // Cộng dồn hiển thị (10s, 20s, 30s...)
        setSeekValue(prev => prev + 10);
        setFeedback({ 
          visible: true, 
          type: isRight ? "forward" : "rewind", 
          side: isRight ? "right" : "left" 
        });

        // Tự động reset feedback sau khi ngừng tap
        clearTimeout(window.seekTimer);
        window.seekTimer = setTimeout(() => {
          setFeedback(f => ({ ...f, visible: false }));
          setSeekValue(0);
        }, 800);
      }
    },
    onDrag: ({ active, movement: [, my], initial: [ix], last }) => {
      const rect = containerRef.current.getBoundingClientRect();
      const isLeft = (ix - rect.left) < rect.width / 2;
      
      if (active) {
        const sensitivity = 0.005;
        const delta = -my * sensitivity; // Vuốt lên là tăng

        if (isLeft) {
          // Chỉnh độ sáng (CSS Filter)
          const currentBr = parseFloat(videoRef.current.style.filter?.replace("brightness(", "") || 1);
          const newBr = Math.min(2, Math.max(0.4, currentBr + delta));
          videoRef.current.style.filter = `brightness(${newBr})`;
          setFeedback({ visible: true, type: "brightness", value: `${Math.round(newBr * 100)}%`, side: "left-bar" });
        } else {
          // Chỉnh âm lượng
          const newVol = Math.min(1, Math.max(0, videoRef.current.volume + delta));
          videoRef.current.volume = newVol;
          setFeedback({ visible: true, type: "volume", value: `${Math.round(newVol * 100)}%`, side: "right-bar" });
        }
      }
      if (last) {
        setTimeout(() => setFeedback(f => ({ ...f, visible: false })), 500);
      }
    }
  }, {
    drag: { threshold: 10 },
    tap: { threshold: 20 }
  });

  // 3. Logic HLS (Giữ nguyên)
  useEffect(() => {
    if (!videoRef.current || !src) return;
    const video = videoRef.current;
    if (hlsRef.current) hlsRef.current.destroy();
    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(`/proxy-stream?url=${encodeURIComponent(src)}`);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(() => {}));
      hlsRef.current = hls;
    }
    const up = () => setProgress((video.currentTime / video.duration) * 100 || 0);
    video.addEventListener("timeupdate", up);
    return () => video.removeEventListener("timeupdate", up);
  }, [src]);

  return (
    <Box 
      ref={containerRef} 
      {...bind()} 
      sx={{ 
        position: "relative", width: "100%", bgcolor: "black", 
        aspectRatio: "16/9", touchAction: "none", overflow: "hidden", borderRadius: 2 
      }}
    >
      <video 
        ref={videoRef} 
        autoPlay 
        onEnded={onVideoEnd} 
        style={{ width: "100%", height: "100%", objectFit: "contain", transition: "filter 0.1s" }} 
      />

      {/* Nút Play/Pause trung tâm (Framer Motion) */}
      <AnimatePresence>
        {showToolbar && (
          <motion.box
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            style={{ position: "absolute", top: "50%", left: "50%", x: "-50%", y: "-50%", zIndex: 15 }}
          >
            <IconButton onClick={togglePlay} sx={{ bgcolor: "rgba(0,0,0,0.5)", p: 3, color: "white" }}>
              {isPlaying ? <Pause sx={{ fontSize: 60 }} /> : <PlayArrow sx={{ fontSize: 60 }} />}
            </IconButton>
          </motion.box>
        )}
      </AnimatePresence>

      {/* Hiệu ứng Sóng âm khi Tua (Framer Motion) */}
      <AnimatePresence>
        {feedback.visible && (feedback.type === "forward" || feedback.type === "rewind") && (
          <motion.div
            key={feedback.type + seekValue} // Reset animation mỗi khi tap
            initial={{ scale: 0.8, opacity: 1 }}
            animate={{ scale: 1.5, opacity: 0 }}
            style={{
              position: "absolute", top: "50%",
              left: feedback.side === "left" ? "25%" : "75%",
              x: "-50%", y: "-50%", zIndex: 10,
              width: 150, height: 150, borderRadius: "50%",
              backgroundColor: "rgba(255,255,255,0.2)",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              color: "white", pointerEvents: "none"
            }}
          >
            {feedback.type === "forward" ? <FastForward fontSize="large" /> : <FastRewind fontSize="large" />}
            <Typography variant="h6" fontWeight="bold">{seekValue}s</Typography>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chỉ báo Volume/Brightness (Indicator) */}
      <AnimatePresence>
        {feedback.visible && (feedback.type === "brightness" || feedback.type === "volume") && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              position: "absolute", top: "15%",
              left: feedback.side === "left-bar" ? "10%" : "90%",
              transform: "translateX(-50%)",
              backgroundColor: "rgba(0,0,0,0.8)", padding: "12px",
              borderRadius: "8px", color: "white", zIndex: 11,
              display: "flex", flexDirection: "column", alignItems: "center",
              border: "1px solid rgba(255,255,255,0.2)"
            }}
          >
            {feedback.type === "brightness" ? <Brightness6 /> : <VolumeUp />}
            <Typography variant="caption" sx={{ mt: 0.5 }}>{feedback.value}</Typography>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Toolbar */}
      <AnimatePresence>
        {showToolbar && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            style={{
              position: "absolute", bottom: 0, left: 0, right: 0,
              background: "linear-gradient(transparent, rgba(0,0,0,0.9))",
              padding: "20px", zIndex: 12
            }}
          >
            <LinearProgress 
              variant="determinate" value={progress} 
              sx={{ height: 4, mb: 1.5, bgcolor: "rgba(255,255,255,0.2)", "& .MuiLinearProgress-bar": { bgcolor: "red" } }} 
            />
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" sx={{ color: "white" }}>{title}</Typography>
              <IconButton size="small" sx={{color: "white"}} onClick={() => containerRef.current.requestFullscreen()}>
                <Fullscreen />
              </IconButton>
            </Stack>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
};

export default VideoPlayer;
