// src/components/VideoPlayer.js
import React, { useRef, useEffect } from "react";
import Hls from "hls.js";
import { Card, Box, Typography } from "@mui/material";

const VideoPlayer = ({ src, title }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && src) {
      const proxiedUrl = `/proxy-stream?url=${encodeURIComponent(src)}`;

      if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(proxiedUrl);
        hls.attachMedia(videoRef.current);
      } else if (videoRef.current.canPlayType("application/vnd.apple.mpegurl")) {
        videoRef.current.src = proxiedUrl;
      }
    }
  }, [src]);

  return (
    <Card sx={{ mt: 2 }}>
      {title && (
        <Box sx={{ p: 2 }}>
          <Typography variant="h6">{title}</Typography>
        </Box>
      )}
      <Box
        sx={{
          width: "100%",
          maxWidth: 960,
          margin: "0 auto",
          bgcolor: "black",
          aspectRatio: "16/9" // cố định tỷ lệ khung hình
        }}
      >
        <video
          ref={videoRef}
          controls
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
