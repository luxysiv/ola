import React, { useEffect, useRef } from "react";
import {
  Media,
  Video,
  Poster,
  Controls,
  PlayButton,
  MuteButton,
  FullscreenButton,
  Time,
  SeekBar,
} from "@vidstack/react";

import "@vidstack/react/styles/base.css";
import "@vidstack/react/styles/video.css";

import { Card, Box, Typography } from "@mui/material";
import { saveHistoryItem } from "../utils/history";

const VideoPlayer = ({ src, title, movieInfo, onVideoEnd }) => {
  const mediaRef = useRef(null);

  useEffect(() => {
    if (!movieInfo) return;

    const interval = setInterval(() => {
      const media = mediaRef.current;
      if (!media || media.paused) return;

      saveHistoryItem({
        ...movieInfo,
        currentTime: Math.floor(media.currentTime),
        updatedAt: Date.now(),
      });
    }, 10000);

    return () => clearInterval(interval);
  }, [movieInfo]);

  return (
    <Card sx={{ mt: 2, bgcolor: "#000", boxShadow: 0 }}>
      {title && (
        <Box sx={{ p: 2, bgcolor: "#1a1a1a", color: "white" }}>
          <Typography variant="h6">{title}</Typography>
        </Box>
      )}

      <Box sx={{ width: "100%", bgcolor: "black" }}>
        <Media
          ref={mediaRef}
          onEnded={onVideoEnd}
          style={{ width: "100%", aspectRatio: "16/9" }}
        >
          <Video src={src} poster={movieInfo?.poster} />

          <Controls>
            <PlayButton />
            <MuteButton />
            <SeekBar />
            <Time type="current" />
            <Time type="duration" />
            <FullscreenButton />
          </Controls>
        </Media>
      </Box>
    </Card>
  );
};

export default React.memo(VideoPlayer);
