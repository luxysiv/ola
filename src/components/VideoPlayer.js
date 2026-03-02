import React, { useRef, useEffect, useState, useCallback } from "react";
import Hls from "hls.js";
import Hammer from "hammerjs";
import { 
  Box, Typography, Fade, IconButton, 
  LinearProgress, Stack 
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
  
  // State cho hiệu ứng tua và thông số
  const [feedback, setFeedback] = useState({ visible: false, type: "", value: "", side: "" });
  const [tapCount, setTapCount] = useState(0);
  const tapTimer = useRef(null);

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

  const autoHideToolbar = () => {
    setShowToolbar(true);
    clearTimeout(window.hideTimer);
    window.hideTimer = setTimeout(() => setShowToolbar(false), 3000);
  };

  useEffect(() => {
    if (!containerRef.current || !videoRef.current) return;

    const mc = new Hammer.Manager(containerRef.current);
    const tap = new Hammer.Tap({ event: 'singletap', taps: 1 });
    const doubleTap = new Hammer.Tap({ event: 'doubletap', taps: 2 });
    const pan = new Hammer.Pan({ direction: Hammer.DIRECTION_VERTICAL, threshold: 10 });

    mc.add([doubleTap, tap, pan]);
    tap.requireFailure(doubleTap);

    // 1. Chạm 1 lần: Hiện Toolbar
    mc.on("singletap", () => {
      setShowToolbar(!showToolbar);
      if (!showToolbar) autoHideToolbar();
    });

    // 2. Double Tap & Multi-Tap (Tua cộng dồn)
    mc.on("doubletap", (ev) => {
      const rect = containerRef.current.getBoundingClientRect();
      const isRight = (ev.center.x - rect.left) > rect.width / 2;
      const type = isRight ? "forward" : "rewind";
      
      // Thực hiện tua 10s
      videoRef.current.currentTime += isRight ? 10 : -10;
      
      // Hiển thị hiệu ứng sóng âm và cộng dồn số giây hiển thị
      setFeedback({ 
        visible: true, 
        type, 
        value: isRight ? "+10s" : "-10s", 
        side: isRight ? "right" : "left" 
      });

      // Tự động ẩn hiệu ứng sau 600ms
      clearTimeout(tapTimer.current);
      tapTimer.current = setTimeout(() => {
        setFeedback(f => ({ ...f, visible: false }));
      }, 600);
    });

    // 3. Vuốt (Pan) chỉnh Brightness/Volume
    mc.on("panmove", (ev) => {
      const rect = containerRef.current.getBoundingClientRect();
      const isLeft = (ev.center.x - rect.left) < rect.width / 2;
      const change = ev.velocityY < 0 ? 0.01 : -0.01;

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

    mc.on("panend", () => setTimeout(() => setFeedback(f => ({ ...f, visible: false })), 500));

    return () => mc.destroy();
  }, [showToolbar]);

  /* Logic HLS & Progress */
  useEffect(() => {
    if (!videoRef.current || !src) return;
    const video = videoRef.current;
    if (hlsRef.current) hlsRef.current.destroy();
    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(`/proxy-stream?url=${encodeURIComponent(src)}`);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => video.play());
      hlsRef.current = hls;
    }
    const up = () => setProgress((video.currentTime / video.duration) * 100 || 0);
    video.addEventListener("timeupdate", up);
    return () => video.removeEventListener("timeupdate", up);
  }, [src]);

  return (
    <Box ref={containerRef} sx={{ position: "relative", width: "100%", bgcolor: "black", aspectRatio: "16/9", touchAction: "none", overflow: "hidden", borderRadius: 2 }}>
      <video ref={videoRef} autoPlay onEnded={onVideoEnd} style={{ width: "100%", height: "100%", objectFit: "contain", transition: "filter 0.1s" }} />

      {/* Nút Play/Pause trung tâm */}
      <Fade in={showToolbar}>
        <Box sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 15 }}>
          <IconButton onClick={togglePlay} sx={{ bgcolor: "rgba(0,0,0,0.5)", "&:hover": {bgcolor: "rgba(0,0,0,0.7)"}, p: 3 }}>
            {isPlaying ? <Pause sx={{ fontSize: 60, color: "white" }} /> : <PlayArrow sx={{ fontSize: 60, color: "white" }} />}
          </IconButton>
        </Box>
      </Fade>

      {/* Hiệu ứng Sóng âm khi Double Tap */}
      <Fade in={feedback.visible && (feedback.type === "forward" || feedback.type === "rewind")}>
        <Box sx={{ position: "absolute", top: "50%", left: feedback.side === "left" ? "25%" : "75%", transform: "translate(-50%, -50%)", zIndex: 10 }}>
          <Box className="sonar-wave">
            {feedback.type === "forward" ? <FastForward sx={{fontSize: 50}} /> : <FastRewind sx={{fontSize: 50}} />}
            <Typography variant="h6" fontWeight="bold">{feedback.value}</Typography>
          </Box>
        </Box>
      </Fade>

      {/* Chỉ báo Volume/Brightness */}
      <Fade in={feedback.visible && (feedback.type === "brightness" || feedback.type === "volume")}>
        <Box sx={{ position: "absolute", top: "15%", left: feedback.side === "left-bar" ? "10%" : "90%", transform: "translateX(-50%)", bgcolor: "rgba(0,0,0,0.7)", p: 1.5, borderRadius: 2, display: "flex", flexDirection: "column", alignItems: "center", zIndex: 11 }}>
          {feedback.type === "brightness" ? <Brightness6 color="inherit" /> : <VolumeUp color="inherit" />}
          <Typography variant="caption" sx={{color: "white", mt: 0.5}}>{feedback.value}</Typography>
        </Box>
      </Fade>

      {/* Bottom Toolbar */}
      <Fade in={showToolbar}>
        <Box sx={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(transparent, rgba(0,0,0,0.9))", p: 2, zIndex: 12 }}>
          <LinearProgress variant="determinate" value={progress} sx={{ height: 4, mb: 2, bgcolor: "rgba(255,255,255,0.3)", "& .MuiLinearProgress-bar": { bgcolor: "red" } }} />
          <Stack direction="row" justifyContent="space-between">
            <Typography variant="caption">{title}</Typography>
            <IconButton size="small" color="inherit" onClick={() => containerRef.current.requestFullscreen()}><Fullscreen /></IconButton>
          </Stack>
        </Box>
      </Fade>

      <style>{`
        @keyframes sonar { 0% { transform: scale(0.7); opacity: 1; } 100% { transform: scale(1.6); opacity: 0; } }
        .sonar-wave { width: 140px; height: 140px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; animation: sonar 0.6s ease-out; color: white; backdrop-filter: blur(2px); }
      `}</style>
    </Box>
  );
};

export default VideoPlayer;
