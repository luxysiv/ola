// src/components/VideoPlayer.js
import React, { useRef, useEffect } from "react";
import Hls from "hls.js";
import {
  Card,
  CardContent,
  Typography,
  Box
} from "@mui/material";

const VideoPlayer = ({ src, title }) => {
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
      {title && (
        <CardContent>
          <Typography variant="h6">{title}</Typography>
        </CardContent>
      )}
      <Box sx={{ width: "100%", bgcolor: "black" }}>
        <video
          ref={videoRef}
          controls
          style={{ width: "100%", borderRadius: 4 }}
        />
      </Box>
    </Card>
  );
};

export default VideoPlayer;
