// src/components/VideoPlayer.js
import React, { useRef, useEffect } from "react";
import Hls from "hls.js";
import { Card, Box } from "@mui/material";

const VideoPlayer = ({ src }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && src) {
      if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(src);
        hls.attachMedia(videoRef.current);
      } else if (videoRef.current.canPlayType("application/vnd.apple.mpegurl")) {
        videoRef.current.src = src;
      }
    }
  }, [src]);

  return (
    <Card sx={{ mt: 2 }}>
      <Box
        sx={{
          width: "100%",
          maxWidth: 960,       // cố định chiều rộng tối đa
          margin: "0 auto",
          bgcolor: "black",
          aspectRatio: "16/9"  // cố định tỷ lệ khung hình
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
