import React, { useEffect, useRef } from 'react';
// 1. Thay đổi cách import MediaPlayer và các thành phần chính
import { MediaPlayer, MediaProvider, Poster } from '@vidstack/react';

// 2. SỬA LỖI BUILD: Import trực tiếp từ đường dẫn đã được export chính thức
import { DefaultVideoLayout, defaultLayoutIcons } from '@vidstack/react/player/layouts/default';

// 3. Import CSS (Giữ nguyên)
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
      {title && (
        <Box sx={{ p: 2, bgcolor: "#1a1a1a", color: "white" }}>
          <Typography variant="h6">{title}</Typography>
        </Box>
      )}
      
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
          style={{ outline: 'none' }}
        >
          <MediaProvider>
            {movieInfo?.poster && (
              <Poster src={movieInfo.poster} alt={movieInfo.name} className="vds-poster" />
            )}
          </MediaProvider>
          {/* Layout này sẽ tự động handle các icon và thanh progress bar */}
          <DefaultVideoLayout icons={defaultLayoutIcons} />
        </MediaPlayer>
      </Box>

      <style jsx global>{`
        .vds-time-group { display: flex !important; }
        media-player:focus { outline: none !important; }
      `}</style>
    </Card>
  );
};

export default React.memo(VideoPlayer);
