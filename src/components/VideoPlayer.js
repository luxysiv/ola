import React, { useRef, useEffect } from "react";
import Hls from "hls.js";
import { Card, Box, Typography } from "@mui/material";
import { saveHistoryItem } from "../utils/history";

const VideoPlayer = ({ src, title, movieInfo, onVideoEnd }) => {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const hasResumed = useRef(false);

  // Reset trạng thái resume khi đổi tập (src thay đổi)
  useEffect(() => {
    hasResumed.current = false;
  }, [src]);

  /* Load video stream */
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

    return () => {
      if (hlsRef.current) hlsRef.current.destroy();
    };
  }, [src]);

  /* Xử lý Resume Time */
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !movieInfo.currentTime || hasResumed.current) return;

    const handleCanPlay = () => {
      if (!hasResumed.current) {
        video.currentTime = movieInfo.currentTime;
        hasResumed.current = true;
      }
    };

    video.addEventListener("loadedmetadata", handleCanPlay);
    return () => video.removeEventListener("loadedmetadata", handleCanPlay);
  }, [src, movieInfo.currentTime]);

  /* Lưu lịch sử mỗi 5s */
  useEffect(() => {
    if (!movieInfo) return;
    const interval = setInterval(() => {
      const video = videoRef.current;
      if (video && !video.paused) {
        saveHistoryItem({
          ...movieInfo,
          currentTime: video.currentTime,
          updatedAt: Date.now()
        });
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [movieInfo]);

  return (
    <Card sx={{ mt: 2, bgcolor: "#1a1a1a", color: "white" }}>
      {title && <Box sx={{ p: 2 }}><Typography variant="h6">{title}</Typography></Box>}
      <Box sx={{ width: "100%", maxWidth: 960, margin: "0 auto", bgcolor: "black", aspectRatio: "16/9" }}>
        <video
          ref={videoRef}
          controls
          autoPlay
          onEnded={onVideoEnd} // Trigger chuyển tập
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
        />
      </Box>
    </Card>
  );
};

export default VideoPlayer;
