import React, { useEffect, useRef } from 'react';
import { MediaPlayer, MediaProvider, Poster } from '@vidstack/react';
import { DefaultVideoLayout } from '@vidstack/react/player/layouts/default';

// Import CSS bắt buộc
import '@vidstack/react/player/styles/default/theme.css';
import '@vidstack/react/player/styles/default/layouts/video.css';

// Import Icons từ thư viện Vidstack
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
  CaptionOnIcon,
  CaptionOffIcon,
  PipEnterIcon,
  PipExitIcon
} from '@vidstack/react/icons';

import { Card, Box, Typography } from "@mui/material";
import { saveHistoryItem } from "../utils/history";

const VideoPlayer = ({ src, title, movieInfo, onVideoEnd }) => {
  const player = useRef(null);
  
  // Proxy URL để tránh lỗi CORS khi stream
  const proxiedUrl = `/proxy-stream?url=${encodeURIComponent(src)}`;
  
  // Cấu hình bộ Icon tùy chỉnh
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
      ArrowLeft: SettingsIcon, // Có thể thay bằng icon mũi tên nếu muốn
    },
    CaptionButton: {
      On: CaptionOnIcon,
      Off: CaptionOffIcon,
    },
    PIPButton: {
      Enter: PipEnterIcon,
      Exit: PipExitIcon,
    }
  };

  useEffect(() => {
    if (!movieInfo) return;

    // Lưu lịch sử xem mỗi 10 giây
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
        <Box sx={{ p: 2, bgcolor: "#1a1a1a", borderBottom: "1px solid #333" }}>
          <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 500 }}>
            {title}
          </Typography>
        </Box>
      )}

      <Box sx={{ width: "100%", maxWidth: 1200, margin: "0 auto", position: 'relative' }}>
        <MediaPlayer
          ref={player}
          src={proxiedUrl}
          viewType="video"
          streamType="on-demand"
          playsInline
          autoplay
          onEnded={onVideoEnd}
          onCanPlay={() => {
            // Resume lại thời điểm đã xem trước đó
            if (movieInfo?.currentTime > 0 && player.current) {
              player.current.currentTime = movieInfo.currentTime;
            }
          }}
          style={{ backgroundColor: '#000' }}
        >
          <MediaProvider>
            {movieInfo?.thumb && (
              <Poster
                src={movieInfo.thumb}
                alt={movieInfo.name}
                className="vds-poster"
                style={{ objectFit: 'cover' }}
              />
            )}
          </MediaProvider>

          {/* Sử dụng DefaultVideoLayout với bộ icon đã tùy chỉnh */}
          <DefaultVideoLayout 
            icons={customIcons} 
            breakpoints={{ small: 576 }} // Tối ưu hiển thị trên mobile
          />
        </MediaPlayer>
      </Box>
    </Card>
  );
};

export default VideoPlayer;
