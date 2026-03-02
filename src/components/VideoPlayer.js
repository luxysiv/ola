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
  
  // States cho hiệu ứng
  const [feedback, setFeedback] = useState({ visible: false, type: "", side: "" });
  const [seekAccumulator, setSeekAccumulator] = useState(0); // Cộng dồn số giây tua
  const [indicatorValue, setIndicatorValue] = useState("");

  // Tự động ẩn Toolbar
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

  // --- XỬ LÝ CỬ CHỈ VỚI @USE-GESTURE ---
  const bind = useGesture({
    onTap: ({ event, tapCount, xy: [x, y] }) => {
      const rect = containerRef.current.getBoundingClientRect();
      const isRight = (x - rect.left) > rect.width / 2;

      if (tapCount === 1) {
        // 1 tap: Chỉ hiện/ẩn bảng điều khiển
        setShowToolbar(!showToolbar);
        if (!showToolbar) autoHideToolbar();
      } 
      else if (tapCount >= 2) {
        // Double tap trở lên: Tua 10s mỗi lần tap
        const direction = isRight ? 1 : -1;
        videoRef.current.currentTime += direction * 10;
        
        // Cập nhật giá trị cộng dồn hiển thị
        setSeekAccumulator(prev => prev + 10);
        setFeedback({ 
          visible: true, 
          type: isRight ? "forward" : "rewind", 
          side: isRight ? "right" : "left" 
        });

        // Reset sau khi ngừng tap 800ms
        clearTimeout(window.seekTimer);
        window.seekTimer = setTimeout(() => {
          setFeedback(f => ({ ...f, visible: false }));
          setSeekAccumulator(0);
        }, 800);
      }
    },
    onDrag: ({ active, movement: [, my], initial: [ix], last }) => {
      const rect = containerRef.current.getBoundingClientRect();
      const isLeft = (ix - rect.left) < rect.width / 2;
      
      if (active) {
        const delta = -my * 0.005; // Độ nhạy vuốt

        if (isLeft) {
          // Vuốt bên trái: Độ sáng
          const currentBr = parseFloat(videoRef.current.style.filter?.replace("brightness(", "") || 1);
          const newBr = Math.min(2, Math.max(0.4, currentBr + delta));
          videoRef.current.style.filter = `brightness(${newBr})`;
          setIndicatorValue(`${Math.round(newBr * 100)}%`);
          setFeedback({ visible: true, type: "brightness", side: "left-top" });
        } else {
          // Vuốt bên phải: Âm thanh
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

  // --- LOGIC HLS ---
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
      <video 
        ref={videoRef} 
        autoPlay 
        style={{ width: "100%", height: "100%", objectFit: "contain", transition: "filter 0.1s" }} 
      />

      {/* 1. NÚT PLAY/PAUSE TRUNG TÂM */}
      <AnimatePresence>
        {showToolbar && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            style={{ position: "absolute", top: "50%", left: "50%", x: "-50%", y: "-50%", zIndex: 10 }}
          >
            <IconButton onClick={togglePlay} sx={{ bgcolor: "rgba(0,0,0,0.5)", p: 4, color: "white", "&:hover": {bgcolor: "rgba(0,0,0,0.7)"} }}>
              {isPlaying ? <Pause sx={{ fontSize: 80 }} /> : <PlayArrow sx={{ fontSize: 80 }} />}
            </IconButton>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. HIỆU ỨNG SÓNG ÂM TUA PHIM (MULTITAP) */}
      <AnimatePresence>
        {feedback.visible && (feedback.type === "forward" || feedback.type === "rewind") && (
          <motion.div
            key={seekAccumulator} // Quan trọng: Reset animation mỗi khi cộng dồn giây
            initial={{ opacity: 1, scale: 0.8 }}
            animate={{ opacity: 0, scale: 1.5 }}
            style={{
              position: "absolute", top: "50%",
              left: feedback.side === "left" ? "25%" : "75%",
              x: "-50%", y: "-50%",
              width: 160, height: 160, borderRadius: "50%",
              backgroundColor: "rgba(255,255,255,0.15)",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              zIndex: 5, pointerEvents: "none", color: "white"
            }}
          >
            {feedback.type === "forward" ? <FastForward fontSize="large" /> : <FastRewind fontSize="large" />}
            <Typography variant="h5" fontWeight="bold">+{seekAccumulator}s</Typography>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. INDICATOR ĐỘ SÁNG / ÂM THANH */}
      <AnimatePresence>
        {feedback.visible && (feedback.type === "brightness" || feedback.type === "volume") && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              position: "absolute", top: "10%",
              left: feedback.side === "left-top" ? "10%" : "90%",
              x: "-50%",
              backgroundColor: "rgba(0,0,0,0.8)", padding: "12px 20px",
              borderRadius: "12px", color: "white", zIndex: 12,
              display: "flex", flexDirection: "column", alignItems: "center",
              border: "1px solid rgba(255,255,255,0.2)", backdropFilter: "blur(8px)"
            }}
          >
            {feedback.type === "brightness" ? <Brightness6 /> : <VolumeUp />}
            <Typography variant="h6" sx={{ mt: 0.5 }}>{indicatorValue}</Typography>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. THANH TOOLBAR (BẢNG ĐIỀU KHIỂN) */}
      <AnimatePresence>
        {showToolbar && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            style={{
              position: "absolute", bottom: 0, left: 0, right: 0,
              background: "linear-gradient(transparent, rgba(0,0,0,0.95))",
              padding: "20px", z={{ zIndex: 11 }}
            }}
          >
            <Typography variant="subtitle1" sx={{ color: "white", mb: 1, fontWeight: 500 }}>{title}</Typography>
            
            <LinearProgress 
              variant="determinate" value={progress} 
              sx={{ height: 6, mb: 2, borderRadius: 3, bgcolor: "rgba(255,255,255,0.2)", "& .MuiLinearProgress-bar": { bgcolor: "#ff0000" } }} 
            />

            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Stack direction="row" spacing={1}>
                <IconButton color="inherit" onClick={onVideoEnd} sx={{ color: "white" }}>
                  <SkipNext fontSize="large" />
                </IconButton>
              </Stack>

              <IconButton color="inherit" onClick={() => containerRef.current.requestFullscreen()} sx={{ color: "white" }}>
                <Fullscreen fontSize="large" />
              </IconButton>
            </Stack>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
};

export default VideoPlayer;
