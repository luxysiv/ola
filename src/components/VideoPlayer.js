import React, { useRef, useEffect, useState } from "react";
import Hls from "hls.js";
import Hammer from "hammerjs";
import { Card, Box, Typography, Fade } from "@mui/material";
import { 
  FastForward, FastRewind, 
  BrightnessLow, VolumeUp 
} from "@mui/icons-material";
import { saveHistoryItem } from "../utils/history";

const VideoPlayer = ({ src, title, movieInfo, onVideoEnd }) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const hlsRef = useRef(null);
  const hasResumed = useRef(false);

  // States cho UI Feedback
  const [feedback, setFeedback] = useState({ type: null, value: "", visible: false });

  const showFeedback = (type, value) => {
    setFeedback({ type, value, visible: true });
    setTimeout(() => setFeedback(prev => ({ ...prev, visible: false })), 800);
  };

  useEffect(() => {
    if (!containerRef.current || !videoRef.current) return;

    const mc = new Hammer.Manager(containerRef.current);
    
    // Cấu hình các bộ nhận diện
    const DoubleTap = new Hammer.Tap({ event: 'doubletap', taps: 2 });
    const Pan = new Hammer.Pan({ direction: Hammer.DIRECTION_VERTICAL });
    
    mc.add([DoubleTap, Pan]);

    // 1. Xử lý Double Tap (Tua 10s)
    mc.on("doubletap", (ev) => {
      const video = videoRef.current;
      const rect = containerRef.current.getBoundingClientRect();
      const clickX = ev.center.x - rect.left;
      const isRight = clickX > rect.width / 2;

      if (isRight) {
        video.currentTime = Math.min(video.duration, video.currentTime + 10);
        showFeedback("forward", "+10s");
      } else {
        video.currentTime = Math.max(0, video.currentTime - 10);
        showFeedback("rewind", "-10s");
      }
    });

    // 2. Xử lý Vuốt (Âm lượng & Độ sáng)
    mc.on("panmove", (ev) => {
      const rect = containerRef.current.getBoundingClientRect();
      const isLeftSide = ev.center.x - rect.left < rect.width / 2;
      const sensitivity = 0.01; // Điều chỉnh độ nhạy
      const delta = -ev.velocity * 2; // Vuốt lên là âm, nên đảo dấu

      if (isLeftSide) {
        // Giả lập độ sáng (sử dụng CSS Filter vì JS không chỉnh được độ sáng màn hình hệ thống)
        const currentBr = parseFloat(videoRef.current.style.filter?.replace("brightness(", "") || 1);
        const newBr = Math.min(2, Math.max(0.3, currentBr + delta * sensitivity));
        videoRef.current.style.filter = `brightness(${newBr})`;
        showFeedback("brightness", `${Math.round(newBr * 100)}%`);
      } else {
        // Chỉnh âm lượng
        const newVol = Math.min(1, Math.max(0, videoRef.current.volume + delta * sensitivity));
        videoRef.current.volume = newVol;
        showFeedback("volume", `${Math.round(newVol * 100)}%`);
      }
    });

    return () => mc.destroy();
  }, [src]);

  /* Logic HLS và History giữ nguyên như code cũ của bạn */
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
    return () => hlsRef.current?.destroy();
  }, [src]);

  return (
    <Card sx={{ mt: 2, bgcolor: "#1a1a1a", color: "white", overflow: "hidden" }}>
      {title && <Box sx={{ p: 2 }}><Typography variant="h6">{title}</Typography></Box>}
      
      <Box 
        ref={containerRef}
        sx={{ 
          position: "relative", 
          width: "100%", 
          maxWidth: 960, 
          margin: "0 auto", 
          bgcolor: "black", 
          aspectRatio: "16/9",
          touchAction: "none" // Quan trọng cho HammerJS
        }}
      >
        <video
          ref={videoRef}
          controls
          autoPlay
          onEnded={onVideoEnd}
          style={{ width: "100%", height: "100%", objectFit: "contain", transition: "filter 0.2s" }}
        />

        {/* Overlay hiệu ứng phản hồi */}
        <Fade in={feedback.visible}>
          <Box sx={{
            position: "absolute",
            top: "50%",
            left: feedback.type === "forward" ? "75%" : feedback.type === "rewind" ? "25%" : "50%",
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            zIndex: 10
          }}>
            <Box className="ripple-effect">
               {feedback.type === "forward" && <FastForward sx={{ fontSize: 60 }} />}
               {feedback.type === "rewind" && <FastRewind sx={{ fontSize: 60 }} />}
               {feedback.type === "volume" && <VolumeUp sx={{ fontSize: 60 }} />}
               {feedback.type === "brightness" && <BrightnessLow sx={{ fontSize: 60 }} />}
            </Box>
            <Typography variant="h5" sx={{ fontWeight: "bold", textShadow: "2px 2px 4px rgba(0,0,0,0.8)" }}>
              {feedback.value}
            </Typography>
          </Box>
        </Fade>

        {/* CSS cho hiệu ứng sóng âm (Ripple) */}
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes ripple {
            0% { transform: scale(0.8); opacity: 1; }
            100% { transform: scale(1.5); opacity: 0; }
          }
          .ripple-effect {
            background: rgba(255,255,255,0.2);
            border-radius: 50%;
            padding: 20px;
            animation: ripple 0.6s ease-out;
          }
        `}} />
      </Box>
    </Card>
  );
};

export default VideoPlayer;
