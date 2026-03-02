import React, { useRef, useEffect, useState, useCallback } from "react";
import Hls from "hls.js";
import Hammer from "hammerjs";
import { 
  Box, Typography, Fade, IconButton, 
  LinearProgress, Slider, Stack 
} from "@mui/material";
import { 
  FastForward, FastRewind, Brightness6, VolumeUp, 
  PlayArrow, Pause, Fullscreen, SkipNext 
} from "@mui/icons-material";
import { saveHistoryItem } from "../utils/history";

const VideoPlayer = ({ src, title, movieInfo, onVideoEnd }) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const hlsRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [showToolbar, setShowToolbar] = useState(true);
  
  // Feedback state cho Double Tap / Pan
  const [feedback, setFeedback] = useState({ visible: false, type: "", value: "", side: "" });

  // 1. Hàm điều khiển
  const togglePlay = useCallback(() => {
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
    triggerToolbar();
  }, []);

  const triggerToolbar = () => {
    setShowToolbar(true);
    clearTimeout(window.toolbarTimer);
    window.toolbarTimer = setTimeout(() => setShowToolbar(false), 3000);
  };

  const handleFullscreen = () => {
    if (containerRef.current.requestFullscreen) containerRef.current.requestFullscreen();
    else if (containerRef.current.webkitRequestFullscreen) containerRef.current.webkitRequestFullscreen();
  };

  // 2. Thiết lập Hammer.js
  useEffect(() => {
    if (!containerRef.current || !videoRef.current) return;

    const mc = new Hammer.Manager(containerRef.current);
    const tap = new Hammer.Tap({ event: 'singletap', taps: 1 });
    const doubleTap = new Hammer.Tap({ event: 'doubletap', taps: 2 });
    const pan = new Hammer.Pan({ direction: Hammer.DIRECTION_VERTICAL, threshold: 10 });

    mc.add([doubleTap, tap, pan]);
    // Quan trọng: Chỉ chạy single tap nếu double tap thất bại
    tap.requireFailure(doubleTap);

    mc.on("singletap", () => {
      setShowToolbar(prev => !prev);
      if (!showToolbar) triggerToolbar();
    });

    mc.on("doubletap", (ev) => {
      const rect = containerRef.current.getBoundingClientRect();
      const posX = ev.center.x - rect.left;
      const isRight = posX > rect.width / 2;

      if (isRight) {
        videoRef.current.currentTime += 10;
        setFeedback({ visible: true, type: "forward", value: "+10s", side: "right" });
      } else {
        videoRef.current.currentTime -= 10;
        setFeedback({ visible: true, type: "rewind", value: "-10s", side: "left" });
      }
      setTimeout(() => setFeedback(f => ({ ...f, visible: false })), 600);
    });

    mc.on("panmove", (ev) => {
      const rect = containerRef.current.getBoundingClientRect();
      const posX = ev.center.x - rect.left;
      const isLeft = posX < rect.width / 2;
      const sensitivity = 0.01;
      const change = ev.velocityY < 0 ? sensitivity : -sensitivity;

      if (isLeft) {
        const currentBr = parseFloat(videoRef.current.style.filter?.replace("brightness(", "") || 1);
        const newBr = Math.min(2, Math.max(0.4, currentBr + change));
        videoRef.current.style.filter = `brightness(${newBr})`;
        setFeedback({ visible: true, type: "brightness", value: `${Math.round(newBr * 100)}%`, side: "left-bar" });
      } else {
        const newVol = Math.min(1, Math.max(0, videoRef.current.volume + change));
        videoRef.current.volume = newVol;
        setFeedback({ visible: true, type: "volume", value: `${Math.round(newVol * 100)}%`, side: "right-bar" });
      }
    });

    mc.on("panend", () => {
      setTimeout(() => setFeedback(f => ({ ...f, visible: false })), 500);
    });

    return () => mc.destroy();
  }, [showToolbar]);

  /* Logic Load Video & HLS (Giữ nguyên từ code của bạn) */
  useEffect(() => {
    if (!videoRef.current || !src) return;
    const video = videoRef.current;
    const proxiedUrl = `/proxy-stream?url=${encodeURIComponent(src)}`;
    if (hlsRef.current) hlsRef.current.destroy();
    
    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(proxiedUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => video.play());
      hlsRef.current = hls;
    }

    const updateProgress = () => setProgress((video.currentTime / video.duration) * 100 || 0);
    video.addEventListener("timeupdate", updateProgress);
    return () => video.removeEventListener("timeupdate", updateProgress);
  }, [src]);

  return (
    <Box 
      ref={containerRef}
      sx={{ 
        position: "relative", width: "100%", bgcolor: "black", 
        aspectRatio: "16/9", touchAction: "none", overflow: "hidden",
        borderRadius: 2, boxShadow: 10
      }}
    >
      {/* Video Layer */}
      <video
        ref={videoRef}
        autoPlay
        onEnded={onVideoEnd}
        style={{ width: "100%", height: "100%", objectFit: "contain", transition: "filter 0.1s" }}
      />

      {/* 1. Hiệu ứng Sóng âm khi Double Tap */}
      <Fade in={feedback.visible && (feedback.type === "forward" || feedback.type === "rewind")}>
        <Box sx={{
          position: "absolute", top: "50%",
          left: feedback.side === "left" ? "20%" : "80%",
          transform: "translate(-50%, -50%)",
          zIndex: 10, pointerEvents: "none"
        }}>
          <Box className="sonar-wave">
            {feedback.type === "forward" ? <FastForward fontSize="large" /> : <FastRewind fontSize="large" />}
            <Typography variant="h6">{feedback.value}</Typography>
          </Box>
        </Box>
      </Fade>

      {/* 2. Thanh hiển thị Độ sáng/Âm lượng khi Pan */}
      <Fade in={feedback.visible && (feedback.type === "brightness" || feedback.type === "volume")}>
        <Box sx={{
          position: "absolute", top: "20%",
          left: feedback.side === "left-bar" ? "10%" : "90%",
          transform: "translateX(-50%)",
          display: "flex", flexDirection: "column", alignItems: "center",
          bgcolor: "rgba(0,0,0,0.6)", p: 1, borderRadius: 2, zIndex: 11
        }}>
          {feedback.type === "brightness" ? <Brightness6 /> : <VolumeUp />}
          <Typography variant="caption">{feedback.value}</Typography>
        </Box>
      </Fade>

      {/* 3. Toolbar (Nổi lên khi chạm) */}
      <Fade in={showToolbar}>
        <Box sx={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          background: "linear-gradient(transparent, rgba(0,0,0,0.9))",
          p: 2, zIndex: 12
        }}>
          <Typography variant="subtitle1" sx={{ mb: 1, ml: 1 }}>{title}</Typography>
          
          <LinearProgress 
            variant="determinate" value={progress} 
            sx={{ height: 4, mb: 2, borderRadius: 2, bgcolor: "rgba(255,255,255,0.3)", "& .MuiLinearProgress-bar": { bgcolor: "red" } }} 
          />
          
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" spacing={1}>
              <IconButton onClick={togglePlay} color="inherit">
                {isPlaying ? <Pause /> : <PlayArrow />}
              </IconButton>
              <IconButton color="inherit" onClick={onVideoEnd}>
                <SkipNext />
              </IconButton>
            </Stack>

            <Stack direction="row" spacing={1}>
              <IconButton color="inherit" onClick={handleFullscreen}>
                <Fullscreen />
              </IconButton>
            </Stack>
          </Stack>
        </Box>
      </Fade>

      {/* CSS cho Hiệu ứng */}
      <style>{`
        @keyframes sonar {
          0% { transform: scale(0.8); opacity: 1; }
          100% { transform: scale(1.8); opacity: 0; }
        }
        .sonar-wave {
          width: 120px; height: 120px;
          background: rgba(255,255,255,0.2);
          border-radius: 50%;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          animation: sonar 0.6s ease-out;
        }
      `}</style>
    </Box>
  );
};

export default VideoPlayer;
