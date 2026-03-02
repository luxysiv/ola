import React, { useRef, useEffect, useState } from "react";
import Hls from "hls.js";
import { useGesture } from "@use-gesture/react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Box, Typography, IconButton, LinearProgress, Stack 
} from "@mui/material";
import { 
  FastForward, FastRewind, Brightness6, VolumeUp, 
  PlayArrow, Pause, Fullscreen, SkipNext 
} from "@mui/icons-material";

const VideoPlayer = ({ src, title, movieInfo, onVideoEnd }) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const hlsRef = useRef(null);
  
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [showToolbar, setShowToolbar] = useState(true);
  
  const [feedback, setFeedback] = useState({ visible: false, type: "", side: "" });
  const [seekAccumulator, setSeekAccumulator] = useState(0); 
  const [indicatorValue, setIndicatorValue] = useState("");

  const autoHideToolbar = () => {
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
    autoHideToolbar();
  };

  const bind = useGesture({
    onTap: ({ event, tapCount, xy: [x, y] }) => {
      const rect = containerRef.current.getBoundingClientRect();
      const relativeX = x - rect.left;
      const isRightSide = relativeX > rect.width / 2;

      // 1 Tap: Ẩn/hiện control center (Chỉ nhận diện ở vùng giữa, không sát mép)
      if (tapCount === 1) {
        setShowToolbar(!showToolbar);
        if (!showToolbar) autoHideToolbar();
      } 
      // Multi-tap: Tua phim (Chỉ nhận diện khi tap nhanh ở 2 bên)
      else if (tapCount >= 2) {
        const direction = isRightSide ? 1 : -1;
        videoRef.current.currentTime += direction * 10;
        
        setSeekAccumulator(prev => prev + 10);
        setFeedback({ 
          visible: true, 
          type: isRightSide ? "forward" : "rewind", 
          side: isRightSide ? "right" : "left" 
        });

        clearTimeout(window.seekTimer);
        window.seekTimer = setTimeout(() => {
          setFeedback(f => ({ ...f, visible: false }));
          setSeekAccumulator(0);
        }, 800);
      }
    },
    onDrag: ({ active, movement: [mx, my], initial: [ix], last, direction: [xDir, yDir] }) => {
      const rect = containerRef.current.getBoundingClientRect();
      const relativeIx = ix - rect.left;
      
      // Giới hạn vùng trượt: Chỉ hiệu lực nếu bắt đầu vuốt ở 15% mép trái hoặc 15% mép phải
      const isLeftEdge = relativeIx < rect.width * 0.15;
      const isRightEdge = relativeIx > rect.width * 0.85;

      // Chỉ xử lý nếu vuốt theo chiều dọc (y) và ở vùng mép
      if (active && Math.abs(yDir) > Math.abs(xDir) && (isLeftEdge || isRightEdge)) {
        const delta = -my * 0.002; // Giảm độ nhạy để trượt mượt hơn

        if (isLeftEdge) {
          const currentBr = parseFloat(videoRef.current.style.filter?.replace("brightness(", "") || 1);
          const newBr = Math.min(2, Math.max(0.4, currentBr + delta));
          videoRef.current.style.filter = `brightness(${newBr})`;
          setIndicatorValue(`${Math.round(newBr * 100)}%`);
          setFeedback({ visible: true, type: "brightness", side: "left-top" });
        } else {
          const newVol = Math.min(1, Math.max(0, videoRef.current.volume + delta));
          videoRef.current.volume = newVol;
          setIndicatorValue(`${Math.round(newVol * 100)}%`);
          setFeedback({ visible: true, type: "volume", side: "right-top" });
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
    const update = () => setProgress((video.currentTime / video.duration) * 100 || 0);
    video.addEventListener("timeupdate", update);
    return () => video.removeEventListener("timeupdate", update);
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
      <video ref={videoRef} autoPlay style={{ width: "100%", height: "100%", objectFit: "contain", transition: "filter 0.1s" }} />

      {/* Control Center - Nút Play trung tâm */}
      <AnimatePresence>
        {showToolbar && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            style={{ position: "absolute", top: "50%", left: "50%", x: "-50%", y: "-50%", zIndex: 10 }}
          >
            <IconButton onClick={togglePlay} sx={{ bgcolor: "rgba(0,0,0,0.5)", p: 4, color: "white" }}>
              {isPlaying ? <Pause sx={{ fontSize: 70 }} /> : <PlayArrow sx={{ fontSize: 70 }} />}
            </IconButton>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hiệu ứng tua phim */}
      <AnimatePresence>
        {feedback.visible && (feedback.type === "forward" || feedback.type === "rewind") && (
          <motion.div
            key={seekAccumulator}
            initial={{ opacity: 1, scale: 0.8 }}
            animate={{ opacity: 0, scale: 1.4 }}
            style={{
              position: "absolute", top: "50%",
              left: feedback.side === "left" ? "25%" : "75%",
              x: "-50%", y: "-50%", zIndex: 5, color: "white", textAlign: "center"
            }}
          >
            {feedback.type === "forward" ? <FastForward sx={{fontSize: 60}} /> : <FastRewind sx={{fontSize: 60}} />}
            <Typography variant="h5">+{seekAccumulator}s</Typography>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Indicator Độ sáng/Âm lượng (Sát mép) */}
      <AnimatePresence>
        {feedback.visible && (feedback.type === "brightness" || feedback.type === "volume") && (
          <motion.div
            initial={{ opacity: 0, x: feedback.type === "brightness" ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            style={{
              position: "absolute", top: "20%",
              left: feedback.type === "brightness" ? "5%" : "95%",
              x: "-50%", zIndex: 12,
              backgroundColor: "rgba(0,0,0,0.7)", padding: "10px", borderRadius: "10px", color: "white"
            }}
          >
            {feedback.type === "brightness" ? <Brightness6 /> : <VolumeUp />}
            <Typography variant="caption" display="block">{indicatorValue}</Typography>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Toolbar */}
      <AnimatePresence>
        {showToolbar && (
          <motion.div
            initial={{ y: 50 }} animate={{ y: 0 }} exit={{ y: 50 }}
            style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(transparent, rgba(0,0,0,0.9))", padding: "15px", zIndex: 11 }}
          >
            <LinearProgress variant="determinate" value={progress} sx={{ height: 4, mb: 1, bgcolor: "rgba(255,255,255,0.2)", "& .MuiLinearProgress-bar": { bgcolor: "red" } }} />
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" color="white">{title}</Typography>
              <IconButton size="small" sx={{color: "white"}} onClick={() => containerRef.current.requestFullscreen()}><Fullscreen /></IconButton>
            </Stack>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
};

export default VideoPlayer;
