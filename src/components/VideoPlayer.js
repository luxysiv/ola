import React, { useEffect, useRef, useMemo } from 'react';
import { MediaPlayer, MediaProvider, Poster } from '@vidstack/react';
import { DefaultVideoLayout, defaultLayoutIcons } from '@vidstack/react/player/layouts/default';

// Import CSS
import '@vidstack/react/player/styles/default/theme.css';
import '@vidstack/react/player/styles/default/layouts/video.css';

// Import các Icon bạn muốn thay đổi
import { 
  PlayIcon, 
  PauseIcon, 
  ReplayIcon,
  SeekForward10Icon,
  SeekBackward10Icon
} from '@vidstack/react/icons';

import { Card, Box, Typography } from "@mui/material";
import { saveHistoryItem } from "../utils/history";

const VideoPlayer = ({ src, title, movieInfo, onVideoEnd }) => {
  const player = useRef(null);
  const proxiedUrl = `/proxy-stream?url=${encodeURIComponent(src)}`;
  
  // Dùng useMemo để merge icon, tránh render lại không cần thiết
  // Cách này đảm bảo tất cả các icon 'Default' vẫn tồn tại từ bộ gốc
  const customIcons = useMemo(() => ({
    ...defaultLayoutIcons,
    PlayButton: {
      ...defaultLayoutIcons.PlayButton,
      Play: PlayIcon,
      Pause: PauseIcon,
      Replay: ReplayIcon,
    },
    SeekButton: {
      ...defaultLayoutIcons.SeekButton,
      Forward: SeekForward10Icon,
      Backward: SeekBackward10Icon,
    },
  }), []);

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
    <Card sx={{ mt: 2, bgcolor: "#000", color: "white", boxShadow: 0, borderRadius: 2, overflow: 'hidden' }}>
      {title && (
        <Box sx={{ p: 2, bgcolor: "#1a1a1a" }}>
          <Typography variant="h6" sx={{ fontSize: '1.1rem' }}>{title}</Typography>
        </Box>
      )}

      <Box sx={{ width: "100%", maxWidth: 1200, margin: "0 auto" }}>
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
        >
          <MediaProvider>
            {movieInfo?.thumb && (
              <Poster src={movieInfo.thumb} alt={movieInfo.name} className="vds-poster" />
            )}
          </MediaProvider>

          {/* Truyền object đã được merge an toàn */}
          <DefaultVideoLayout icons={customIcons} />
        </MediaPlayer>
      </Box>
    </Card>
  );
};

export default VideoPlayer;
