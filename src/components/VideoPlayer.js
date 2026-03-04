import React, { useEffect, useRef } from "react";
import {
  MediaPlayer,
  MediaProvider,
  Poster,
  DefaultVideoLayout,
  defaultLayoutIcons,
} from "@vidstack/react";

import "@vidstack/react/styles/default/theme.css";
import "@vidstack/react/styles/default/layouts/video.css";

import { Card, Box, Typography } from "@mui/material";
import { saveHistoryItem } from "../utils/history";

const VideoPlayer = ({ src, title, movieInfo, onVideoEnd }) => {
  const playerRef = useRef(null);

  // Lưu lịch sử xem mỗi 10 giây
  useEffect(() => {
    if (!movieInfo) return;

    const interval = setInterval(() => {
      const player = playerRef.current;
      if (!player || player.paused) return;

      saveHistoryItem({
        ...movieInfo,
        currentTime: Math.floor(player.currentTime),
        updatedAt: Date.now(),
      });
    }, 10000);

    return () => clearInterval(interval);
  }, [movieInfo]);

  return (
    <Card
      sx={{
        mt: 2,
        bgcolor: "#000",
        border: "none",
        boxShadow: 0,
      }}
    >
      {title && (
        <Box sx={{ p: 2, bgcolor: "#1a1a1a", color: "white" }}>
          <Typography variant="h6">{title}</Typography>
        </Box>
      )}

      <Box sx={{ width: "100%", bgcolor: "black" }}>
        <MediaPlayer
          ref={playerRef}
          src={src}
          viewType="video"
          streamType="on-demand"
          playsInline
          autoplay
          onEnded={onVideoEnd}
          onCanPlay={() => {
            const player = playerRef.current;
            if (movieInfo?.currentTime > 0 && player) {
              player.currentTime = movieInfo.currentTime;
            }
          }}
          style={{ width: "100%", aspectRatio: "16/9" }}
        >
          <MediaProvider>
            {movieInfo?.poster && (
              <Poster
                src={movieInfo.poster}
                alt={movieInfo.name}
                className="vds-poster"
              />
            )}
          </MediaProvider>

          {/* Layout mặc định đã xử lý progress, controls, icons */}
          <DefaultVideoLayout icons={defaultLayoutIcons} />
        </MediaPlayer>
      </Box>

      {/* Fix outline & UI nhỏ */}
      <style jsx global>{`
        media-player:focus {
          outline: none !important;
        }

        .vds-time-group {
          display: flex !important;
        }
      `}</style>
    </Card>
  );
};

export default React.memo(VideoPlayer);
