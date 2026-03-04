import React, { useEffect, useRef } from 'react';
import { MediaPlayer, MediaProvider, Poster } from '@vidstack/react';
// Import layout và icon từ đường dẫn mới nhất
import { DefaultVideoLayout, defaultLayoutIcons } from '@vidstack/react/player/layouts/default';

// Import CSS
import '@vidstack/react/player/styles/default/theme.css';
import '@vidstack/react/player/styles/default/layouts/video.css';

import { Card, Box, Typography } from "@mui/material";
import { saveHistoryItem } from "../utils/history";

const VideoPlayer = ({ src, title, movieInfo, onVideoEnd }) => {
  const player = useRef(null);

  useEffect(() => {
    if (!movieInfo) return;
    const interval = setInterval(() => {
      const activePlayer = player.current;
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
    <Card sx={{ mt: 2, bgcolor: "#000", color: "white", overflow: "hidden", border: "none", boxShadow: 0 }}>
      {title && (
        <Box sx={{ p: 2, bgcolor: "#1a1a1a" }}>
          <Typography variant="h6">{title}</Typography>
        </Box>
      )}

      <Box sx={{ width: "100%", maxWidth: 960, margin: "0 auto", bgcolor: "black" }}>
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
          // Style để xóa viền trắng hoàn toàn
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

          {/* Render Layout với bộ icon mặc định */}
          <DefaultVideoLayout 
            icons={defaultLayoutIcons} 
          />
        </MediaPlayer>
      </Box>

      <style jsx global>{`
        /* CSS sửa lỗi hiện số giây trên Mobile */
        .vds-time-group {
          display: flex !important;
          align-items: center;
          gap: 2px;
        }
        
        /* Tắt outline khi click vào player */
        media-player:focus, media-player:active {
          outline: none !important;
          box-shadow: none !important;
        }

        /* Tăng kích thước vùng chạm cho Mobile */
        .vds-gesture {
          cursor: pointer;
        }
      `}</style>
    </Card>
  );
};

export default React.memo(VideoPlayer);
