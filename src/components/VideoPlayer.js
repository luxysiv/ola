import React, { useCallback, useEffect, useRef } from 'react';
import {
  MediaPlayer,
  MediaProvider,
  Poster,
  useMediaContext,
  useMediaRemote,
} from '@vidstack/react';
import {
  DefaultVideoLayout,
  defaultLayoutIcons,
} from '@vidstack/react/player/layouts/default';

import '@vidstack/react/player/styles/default/theme.css';
import '@vidstack/react/player/styles/default/layouts/video.css';

import { Card, Box, Typography } from '@mui/material';
import { saveHistoryItem } from '../utils/history';

// Định nghĩa type cho movieInfo (nên đặt ở file riêng nếu dùng nhiều nơi)
interface MovieInfo {
  id?: string;
  name?: string;
  thumb?: string;
  currentTime?: number;
  // ... các field khác bạn có
}

interface VideoPlayerProps {
  src: string;
  title?: string;
  movieInfo?: MovieInfo | null;
  onVideoEnd?: () => void;
}

const HISTORY_SAVE_INTERVAL_MS = 10000;

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  title,
  movieInfo,
  onVideoEnd,
}) => {
  const playerRef = useRef<MediaPlayerInstance>(null);
  const remote = useMediaRemote();
  const media = useMediaContext();

  const proxiedUrl = `/proxy-stream?url=${encodeURIComponent(src)}`;

  // Hàm lưu history – chỉ gọi khi đang phát
  const saveCurrentPosition = useCallback(() => {
    if (!movieInfo || !media?.currentTime || media.paused) return;

    saveHistoryItem({
      ...movieInfo,
      currentTime: Math.floor(media.currentTime),
      updatedAt: Date.now(),
    });
  }, [movieInfo, media]);

  // Lưu history định kỳ khi đang phát
  useEffect(() => {
    if (!movieInfo) return;

    const interval = setInterval(saveCurrentPosition, HISTORY_SAVE_INTERVAL_MS);

    return () => {
      clearInterval(interval);
      // Lưu lần cuối khi unmount (tránh mất dữ liệu)
      saveCurrentPosition();
    };
  }, [movieInfo, saveCurrentPosition]);

  // Tự động seek đến vị trí cũ khi media sẵn sàng
  useEffect(() => {
    if (
      !movieInfo?.currentTime ||
      movieInfo.currentTime <= 0 ||
      !media?.canPlayThrough
    ) {
      return;
    }

    // Seek bằng remote → chuẩn và an toàn hơn
    remote.seek(movieInfo.currentTime);
  }, [media?.canPlayThrough, movieInfo?.currentTime, remote]);

  return (
    <Card sx={{ mt: 2, bgcolor: 'black', color: 'white', boxShadow: 0 }}>
      {title && (
        <Box sx={{ p: 2, bgcolor: '#1a1a1a' }}>
          <Typography variant="h6">{title}</Typography>
        </Box>
      )}

      <Box sx={{ width: '100%', maxWidth: 960, mx: 'auto' }}>
        <MediaPlayer
          ref={playerRef}
          src={proxiedUrl}
          viewType="video"
          streamType="on-demand"
          playsInline
          autoplay
          onEnded={onVideoEnd}
        >
          <MediaProvider>
            {movieInfo?.thumb && (
              <Poster
                src={movieInfo.thumb}
                alt={movieInfo.name || 'Poster'}
                className="vds-poster"
              />
            )}
          </MediaProvider>

          <DefaultVideoLayout icons={defaultLayoutIcons} />
        </MediaPlayer>
      </Box>
    </Card>
  );
};

export default VideoPlayer;
