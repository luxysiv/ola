import React, { useEffect, useRef } from 'react';
import { MediaPlayer, MediaProvider, Poster } from '@vidstack/react';

// Sử dụng đường dẫn chuẩn của Vidstack v1+
import { DefaultVideoLayout, defaultLayoutIcons } from '@vidstack/react/player/layouts/default';

import '@vidstack/react/player/styles/default/theme.css';
import '@vidstack/react/player/styles/default/layouts/video.css';

import { Card, Box, Typography } from "@mui/material";
import { saveHistoryItem } from "../utils/history";

const VideoPlayer = ({ src, title, movieInfo, onVideoEnd }) => {
  const player = useRef(null);

  useEffect(() => {
    if (!movieInfo) return;
    const interval = setInterval(() => {
      if (player.current && !player.current.paused) {
        saveHistoryItem({
          ...movieInfo,
          currentTime: Math.floor(player.current.currentTime),
          updatedAt: Date.now()
        });
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [movieInfo]);

  return (
    <Card sx={{ mt: 2, bgcolor: "#000", border: "none", boxShadow: 0 }}>
      {title && <Box sx={{ p: 2, bgcolor: "#1a1a1a", color: "white" }}>{title}</Box>}
      
      <Box sx={{ width: "100%", bgcolor: "black" }}>
        <MediaPlayer
          ref={player}
          src={src}
          viewType="video"
          streamType="on-demand"
          playsInline
          autoplay
          onEnded={onVideoEnd}
          onCanPlay={() => {
            if (movieInfo?.currentTime > 0 && player.current) {
              player.current.currentTime = movieInfo.currentTime;
            }
          }}
        >
          <MediaProvider>
            {movieInfo?.poster && <Poster src={movieInfo.poster} className="vds-poster" />}
          </MediaProvider>
          <DefaultVideoLayout icons={defaultLayoutIcons} />
        </MediaPlayer>
      </Box>
    </Card>
  );
};

export default React.memo(VideoPlayer);
