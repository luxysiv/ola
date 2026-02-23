import React, { useRef, useEffect } from "react";
import Hls from "hls.js";
import { Card, Box, Typography } from "@mui/material";
import { saveHistoryItem } from "../utils/history";

const VideoPlayer = ({ src, title, movieInfo, onEnded }) => {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);

  // 1. Khởi tạo Stream
  useEffect(() => {
    if (!videoRef.current || !src) return;
    const video = videoRef.current;
    const proxiedUrl = `/proxy-stream?url=${encodeURIComponent(src)}`;

    if (hlsRef.current) hlsRef.current.destroy();

    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(proxiedUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        // Chỉ tự động play nếu không có resume time (để tránh lỗi trình duyệt chặn)
        video.play().catch(() => {});
      });
      hlsRef.current = hls;
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = proxiedUrl;
    }

    return () => {
      if (hlsRef.current) hlsRef.current.destroy();
    };
  }, [src]);

  // 2. Resume thời gian (Dùng sự kiện loadedmetadata thay vì timeout)
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !movieInfo?.currentTime) return;

    const handleLoaded = () => {
      if (video.currentTime !== movieInfo.currentTime) {
        video.currentTime = movieInfo.currentTime;
      }
    };

    video.addEventListener("loadedmetadata", handleLoaded);
    return () => video.removeEventListener("loadedmetadata", handleLoaded);
  }, [src, movieInfo?.currentTime]);

  // 3. Lưu lịch sử mỗi 5s
  useEffect(() => {
    if (!movieInfo) return;
    const interval = setInterval(() => {
      const video = videoRef.current;
      if (video && !video.paused) {
        saveHistoryItem({
          ...movieInfo,
          currentTime: video.currentTime,
          updatedAt: Date.now(),
        });
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [movieInfo]);

  return (
    <Card sx={{ mt: 2, bgcolor: "#1a1a1a", color: "white" }}>
      {title && (
        <Box sx={{ p: 2 }}>
          <Typography variant="h6">{title}</Typography>
        </Box>
      )}
      <Box sx={{ width: "100%", maxWidth: 960, margin: "0 auto", bgcolor: "black", aspectRatio: "16/9" }}>
        <video
          ref={videoRef}
          controls
          autoPlay
          onEnded={onEnded} // Tự động chuyển tập
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
        />
      </Box>
    </Card>
  );
};

export default VideoPlayer;
