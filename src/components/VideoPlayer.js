import React, { useRef, useEffect, useState } from "react";
import Hls from "hls.js";
import Hammer from "hammerjs";
import { Card, Box, Typography, Fade, IconButton, LinearProgress } from "@mui/material";
import { 
  FastForward, FastRewind, Brightness6, VolumeUp, 
  PlayArrow, Pause 
} from "@mui/icons-material";
import { saveHistoryItem } from "../utils/history";

const VideoPlayer = ({ src, title, movieInfo, onVideoEnd }) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const hlsRef = useRef(null);
  const hasResumed = useRef(false);

  // States quản lý UI tùy chỉnh
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [feedback, setFeedback] = useState({ visible: false, type: "", value: "", side: "" });

  const showFeedback = (type, value, side = "center") => {
    setFeedback({ visible: true, type, value, side });
    setTimeout(() => setFeedback(f => ({ ...f, visible: false })), 800);
  };

  const togglePlay = () => {
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  /* Khởi tạo Hammer.js cho Custom Player */
  useEffect(() => {
    if (!containerRef.current || !videoRef.current) return;

    const mc = new Hammer.Manager(containerRef.current);
    
    // Cấu hình các cử chỉ
    const singleTap = new Hammer.Tap({ event: 'singletap' });
    const doubleTap = new Hammer.Tap({ event: 'doubletap', taps: 2 });
    const pan = new Hammer.Pan({ direction: Hammer.DIRECTION_VERTICAL, threshold: 5 });

    // Ưu tiên DoubleTap trước SingleTap
    mc.add([doubleTap, singleTap, pan]);
    doubleTap.recognizeWith(singleTap);
    singleTap.requireFailure(doubleTap);

    // 1. Chạm đơn: Play/Pause
    mc.on("singletap", togglePlay);

    // 2. Chạm đôi: Tua 10s (Trái/Phải)
    mc.on("doubletap", (ev) => {
      const video = videoRef.current;
      const rect = containerRef.current.getBoundingClientRect();
      const posX = ev.center.x - rect.left;
      
      if (posX > rect.width / 2) {
        video.currentTime = Math.min(video.duration, video.currentTime + 10);
        showFeedback("forward", "+10s", "right");
      } else {
        video.currentTime = Math.max(0, video.currentTime - 10);
        showFeedback("rewind", "-10s", "left");
      }
    });

    // 3. Vuốt lên xuống: Độ sáng (Trái) & Âm lượng (Phải)
    mc.on("pan", (ev) => {
      const video = videoRef.current;
      const rect = containerRef.current.getBoundingClientRect();
      const posX = ev.center.x - rect.left;
      const delta = ev.velocity < 0 ? 0.03 : -0.03;

      if (posX < rect.width / 2) {
        // Cập nhật Filter Brightness
        const currentBr = parseFloat(video.style.filter?.replace("brightness(", "") || 1);
        const newBr = Math.min(2, Math.max(0.3, currentBr + delta));
        video.style.filter = `brightness(${newBr})`;
        showFeedback("brightness", `${Math.round(newBr * 100)}%`, "left");
      } else {
        // Cập nhật Volume
        const newVol = Math.min(1, Math.max(0, video.volume + delta));
        video.volume = newVol;
        showFeedback("volume", `${Math.round(newVol * 100)}%`, "right");
      }
    });

    return () => mc.destroy();
  }, [src]);

  /* Logic xử lý HLS & History (giữ nguyên nhưng bỏ controls mặc định) */
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
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = proxiedUrl;
    }

    // Update Progress Bar
    const handleTimeUpdate = () => {
      const p = (video.currentTime / video.duration) * 100;
      setProgress(p || 0);
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    return () => video.removeEventListener("timeupdate", handleTimeUpdate);
  }, [src]);

  return (
    <Card sx={{ mt: 2, bgcolor: "#000", color: "white", overflow: "hidden", borderRadius: 2 }}>
      {title && <Box sx={{ p: 2, bgcolor: "#1a1a1a" }}><Typography variant="h6">{title}</Typography></Box>}
      
      <Box 
        ref={containerRef}
        sx={{ 
          position: "relative", 
          width: "100%", 
          aspectRatio: "16/9",
          touchAction: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          bgcolor: "black"
        }}
      >
        {/* Video không dùng controls mặc định */}
        <video
          ref={videoRef}
          autoPlay
          onEnded={onVideoEnd}
          style={{ width: "100%", height: "100%", objectFit: "contain", transition: "filter 0.1s ease" }}
        />

        {/* Thanh Progress tùy chỉnh ở dưới cùng */}
        <Box sx={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 5 }}>
          <LinearProgress 
            variant="determinate" 
            value={progress} 
            sx={{ height: 4, bgcolor: "rgba(255,255,255,0.2)", "& .MuiLinearProgress-bar": { bgcolor: "red" } }} 
          />
        </Box>

        {/* Hiệu ứng Phản hồi (Sóng âm) */}
        <Fade in={feedback.visible}>
          <Box sx={{
            position: "absolute",
            top: "50%",
            left: feedback.side === "left" ? "20%" : feedback.side === "right" ? "80%" : "50%",
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
            zIndex: 10
          }}>
            <Box className="wave-effect">
              {feedback.type === "forward" && <FastForward sx={{ fontSize: 80 }} />}
              {feedback.type === "rewind" && <FastRewind sx={{ fontSize: 80 }} />}
              {feedback.type === "brightness" && <Brightness6 sx={{ fontSize: 80 }} />}
              {feedback.type === "volume" && <VolumeUp sx={{ fontSize: 80 }} />}
              <Typography variant="h5" sx={{ mt: 1, fontWeight: "bold" }}>{feedback.value}</Typography>
            </Box>
          </Box>
        </Fade>

        {/* Nút Play/Pause lớn xuất hiện nhanh khi bấm */}
        {!isPlaying && (
          <Box sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", opacity: 0.5 }}>
            <PlayArrow sx={{ fontSize: 100 }} />
          </Box>
        )}
      </Box>

      {/* CSS Styles cho hiệu ứng sóng âm và chuyển động */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes sonarWave {
          0% { transform: scale(0.5); opacity: 1; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        .wave-effect {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.2);
          width: 160px;
          height: 160px;
          border-radius: 50%;
          animation: sonarWave 0.6s ease-out forwards;
          backdrop-filter: blur(5px);
        }
      `}} />
    </Card>
  );
};

export default VideoPlayer;
