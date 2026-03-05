import React, { useEffect, useRef } from 'react';
import { MediaPlayer, MediaProvider, Poster } from '@vidstack/react';
import { DefaultVideoLayout } from '@vidstack/react/player/layouts/default';

// Import CSS
import '@vidstack/react/player/styles/default/theme.css';
import '@vidstack/react/player/styles/default/layouts/video.css';

// Sửa lại tên các Icon cho đúng chuẩn export của @vidstack/react/icons
import { 
  PlayIcon, 
  PauseIcon, 
  ReplayIcon, 
  MuteIcon, 
  VolumeHighIcon, 
  VolumeLowIcon,
  FullscreenIcon, 
  FullscreenExitIcon, 
  SeekForward10Icon, 
  SeekBackward10Icon,
  SettingsIcon,
  ClosedCaptionsIcon,      // Thay cho CaptionOnIcon
  ClosedCaptionsOnIcon,    // Thêm nếu cần phân biệt
  PictureInPictureIcon,    // Thay cho PipEnterIcon
  PictureInPictureExitIcon // Thay cho PipExitIcon
} from '@vidstack/react/icons';

import { Card, Box, Typography } from "@mui/material";
import { saveHistoryItem } from "../utils/history";

const VideoPlayer = ({ src, title, movieInfo, onVideoEnd }) => {
  const player = useRef(null);
  const proxiedUrl = `/proxy-stream?url=${encodeURIComponent(src)}`;
  
  // Cấu hình bộ Icon tùy chỉnh với tên biến đã sửa
  const customIcons = {
    PlayButton: {
      Play: PlayIcon,
      Pause: PauseIcon,
      Replay: ReplayIcon,
    },
    VolumeButton: {
      Mute: MuteIcon,
      Low: VolumeLowIcon,
      High: VolumeHighIcon,
    },
    FullscreenButton: {
      Enter: FullscreenIcon,
      Exit: FullscreenExitIcon,
    },
    SeekButton: {
      Forward: SeekForward10Icon,
      Backward: SeekBackward10Icon,
    },
    Menu: {
      Settings: SettingsIcon,
    },
    CaptionButton: {
      On: ClosedCaptionsOnIcon,
      Off: ClosedCaptionsIcon,
    },
    PIPButton: {
      Enter: PictureInPictureIcon,
      Exit: PictureInPictureExitIcon,
    }
  };

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

          <DefaultVideoLayout icons={customIcons} />
        </MediaPlayer>
      </Box>
    </Card>
  );
};

export default VideoPlayer;
