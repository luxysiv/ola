import React, { useEffect, useRef } from 'react';
import { MediaPlayer, MediaProvider, Poster } from '@vidstack/react';
import { DefaultVideoLayout, defaultLayoutIcons } from '@vidstack/react/player/layouts/default';

// Import CSS mặc định của Vidstack
import '@vidstack/react/player/styles/default/theme.css';
import '@vidstack/react/player/styles/default/layouts/video.css';

import { Card, Box, Typography } from "@mui/material";
import { saveHistoryItem } from "../utils/history";

const VideoPlayer = ({ src, title, movieInfo, onVideoEnd }) => {
  const player = useRef(null);
  const proxiedUrl = `/proxy-stream?url=${encodeURIComponent(src)}`;
  
  useEffect(() => {
    if (!movieInfo) return;
    
    const interval = setInterval(() => {
      const activePlayer = player.current;
      // Vidstack sử dụng thuộc tính .paused trên instance của player
      if (activePlayer && !activePlayer.paused) {
        saveHistoryItem({
          ...movieInfo,
          currentTime: Math.floor(activePlayer.currentTime),
          updatedAt: Date.now()
        });
      }
    }, 10000);
    
    return () => clearInterval(interval);
  }, [movieInfo]);

  return (
    <Card 
      sx={{ 
        mt: 2, 
        bgcolor: "#000", 
        color: "white", 
        overflow: "hidden", 
        border: "none", 
        boxShadow: 0 
      }}
    >
      {title && (
        <Box sx={{ p: 2, bgcolor: "#1a1a1a" }}>
          <Typography variant="h6">{title}</Typography>
        </Box>
      )}

      <Box 
        sx={{ 
          width: "100%", 
          maxWidth: 960, 
          margin: "0 auto", 
          bgcolor: "black",
          // Thay thế cho thẻ <style> bằng cách sử dụng sx prop để can thiệp CSS global/local
          "& media-player": {
            outline: "none !important",
            boxShadow: "none !important",
          },
          "& .vds-time-group": {
            display: "flex !important",
            alignItems: "center",
            gap: "2px",
          }
        }}
      >
        <MediaPlayer
          ref={player}
          src={proxiedUrl}
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
          style={{ outline: 'none', border: 'none' }}
        >
          <MediaProvider>
            {movieInfo?.poster && (
              <Poster
                src={movieInfo.thumb}
                alt={movieInfo.name}
                className="vds-poster"
              />
            )}
          </MediaProvider>

          <DefaultVideoLayout 
            icons={defaultLayoutIcons} 
          />
        </MediaPlayer>
      </Box>
    </Card>
  );
};

export default VideoPlayer;
