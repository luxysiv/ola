import React, { useEffect, useRef } from "react";
import { MediaPlayer, MediaProvider, Poster, isMediaProviderAdapter } from "@vidstack/react";
// 1. Thêm defaultLayoutIcons
import { defaultLayoutIcons, PlyrLayout } from "@vidstack/react/player/layouts/plyr";

import "@vidstack/react/player/styles/base.css";
import "@vidstack/react/player/styles/plyr/theme.css";

import { Card, Box, Typography } from "@mui/material";
import { saveHistoryItem } from "../utils/history";

const VideoPlayer = ({ src, title, movieInfo, onVideoEnd }) => {
  const player = useRef(null);
  const proxiedUrl = `/proxy-stream?url=${encodeURIComponent(src)}`;

  useEffect(() => {
    if (!movieInfo) return;

    const interval = setInterval(() => {
      // 2. Cách lấy currentTime đúng trong Vidstack
      const activePlayer = player.current;
      if (activePlayer && !activePlayer.state.paused) {
        saveHistoryItem({
          ...movieInfo,
          currentTime: Math.floor(activePlayer.state.currentTime),
          updatedAt: Date.now(),
        });
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [movieInfo]);

  return (
    <Card sx={{ mt: 2, bgcolor: "#000", color: "white", boxShadow: 0 }}>
      {title && (
        <Box sx={{ p: 2, bgcolor: "#1a1a1a" }}>
          <Typography variant="h6">{title}</Typography>
        </Box>
      )}

      <Box sx={{ width: "100%", maxWidth: 960, margin: "0 auto" }}>
        <MediaPlayer
          ref={player}
          src={proxiedUrl}
          viewType="video"
          streamType="on-demand"
          playsInline
          onEnded={onVideoEnd}
          // 3. Sử dụng onCanPlay để resume thời gian cũ
          onCanPlay={(detail) => {
            if (movieInfo?.currentTime > 0 && player.current) {
              player.current.currentTime = movieInfo.currentTime;
            }
          }}
        >
          <MediaProvider>
            {movieInfo?.thumb && (
              <Poster 
                className="vds-poster"
                src={movieInfo.thumb} 
                alt={movieInfo.name} 
              />
            )}
          </MediaProvider>

          {/* 4. Truyền icons vào đây */}
          <PlyrLayout icons={defaultLayoutIcons} />
        </MediaPlayer>
      </Box>
    </Card>
  );
};

export default VideoPlayer;
