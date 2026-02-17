import React, { useRef, useEffect } from "react";
import Hls from "hls.js";
import { Card, Box, Typography } from "@mui/material";
import { saveHistoryItem } from "../utils/history";

const VideoPlayer = ({ src, title, movieInfo }) => {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);

  /* =========================
     Load video stream
  ========================= */
  useEffect(() => {
    if (!videoRef.current || !src) return;

    const video = videoRef.current;

    const proxiedUrl =
      `/proxy-stream?url=${encodeURIComponent(src)}`;

    // destroy HLS cũ
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (Hls.isSupported()) {
      const hls = new Hls();

      hls.loadSource(proxiedUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });

      hlsRef.current = hls;
    } else if (
      video.canPlayType(
        "application/vnd.apple.mpegurl"
      )
    ) {
      video.src = proxiedUrl;
      video.addEventListener(
        "loadedmetadata",
        () => video.play().catch(() => {}),
        { once: true }
      );
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [src]);

  /* =========================
     Resume thời gian xem
  ========================= */
  useEffect(() => {
    if (!videoRef.current || !movieInfo) return;

    const timer = setTimeout(() => {
      videoRef.current.currentTime =
        movieInfo.currentTime || 0;
    }, 700);

    return () => clearTimeout(timer);
  }, [src, movieInfo]);

  /* =========================
     Lưu lịch sử xem
  ========================= */
  useEffect(() => {
    if (!movieInfo) return;

    const interval = setInterval(() => {
      const video = videoRef.current;
      if (!video) return;

      saveHistoryItem({
        ...movieInfo,
        currentTime: video.currentTime,
        updatedAt: Date.now()
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [movieInfo]);

  /* =========================
     UI
  ========================= */
  return (
    <Card sx={{ mt: 2 }}>
      {title && (
        <Box sx={{ p: 2 }}>
          <Typography variant="h6">
            {title}
          </Typography>
        </Box>
      )}

      <Box
        sx={{
          width: "100%",
          maxWidth: 960,
          margin: "0 auto",
          bgcolor: "black",
          aspectRatio: "16/9"
        }}
      >
        <video
          ref={videoRef}
          controls
          autoPlay
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            borderRadius: 4
          }}
        />
      </Box>
    </Card>
  );
};

export default VideoPlayer;
