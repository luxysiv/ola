import React, { useEffect, useRef, useState } from 'react';
import { MediaPlayer, MediaProvider, Poster } from '@vidstack/react';
import { DefaultVideoLayout, defaultLayoutIcons } from '@vidstack/react/player/layouts/default';

// Import Vidstack icons
import {
  PlayIcon,
  PauseIcon,
  ReplayIcon,
  MuteIcon,
  VolumeLowIcon,
  VolumeHighIcon,
  SettingsMenuIcon,
  ChapterMenuIcon,
  AudioMenuIcon,
  RadioMenuIcon,
  ClosedCaptionsIcon,
  PIPEnterIcon,
  PIPExitIcon,
  FullscreenEnterIcon,
  FullscreenExitIcon,
  SeekBackwardIcon,
  SeekForward10Icon,
  SeekForward15Icon,
  SeekForward30Icon,
} from '@vidstack/react/player/icons';

import '@vidstack/react/player/styles/default/theme.css';
import '@vidstack/react/player/styles/default/layouts/video.css';

import { Card, Box, Typography, Slider } from "@mui/material";
import { saveHistoryItem } from "../utils/history";

// Custom CSS để tùy biến giao diện Vidstack
const customStyles = `
  /* Tùy biến màu sắc chủ đạo */
  .vds-video-layout {
    --video-brand: #ff4d4d !important;
    --video-focus-ring-color: #ff4d4d !important;
    --video-slider-track-fill: #ff4d4d !important;
    --video-slider-value: #ff4d4d !important;
  }
  
  /* Tùy biến thanh điều khiển */
  .vds-controls {
    background: linear-gradient(0deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 70%, transparent 100%) !important;
  }
  
  /* Bo góc cho poster */
  .vds-poster {
    border-radius: 8px;
  }
  
  /* Tùy biến nút play lớn */
  .vds-play-button {
    background-color: rgba(255, 77, 77, 0.2) !important;
    backdrop-filter: blur(4px);
    width: 64px !important;
    height: 64px !important;
    border-radius: 50% !important;
  }
  
  .vds-play-button:hover {
    background-color: rgba(255, 77, 77, 0.4) !important;
    transform: scale(1.1);
  }
  
  /* Tùy biến time slider */
  .vds-slider {
    --video-slider-track-height: 5px !important;
    --video-slider-thumb-size: 14px !important;
  }
  
  .vds-time-slider .vds-slider-thumb {
    background-color: #ff4d4d !important;
    border: 2px solid white !important;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3) !important;
  }
  
  /* Tùy biến menu settings */
  .vds-menu-items {
    background-color: rgba(26, 26, 26, 0.95) !important;
    backdrop-filter: blur(8px) !important;
    border-radius: 12px !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
    padding: 8px !important;
  }
  
  .vds-menu-item {
    border-radius: 6px !important;
    padding: 8px 16px !important;
  }
  
  .vds-menu-item[data-active] {
    background-color: #ff4d4d !important;
  }
  
  .vds-menu-item[data-open] {
    background-color: rgba(255, 77, 77, 0.2) !important;
  }
  
  /* Tùy biến cho nút seek */
  .vds-seek-button {
    background: rgba(255, 255, 255, 0.1) !important;
    border-radius: 50% !important;
    width: 40px !important;
    height: 40px !important;
    margin: 0 4px !important;
  }
  
  .vds-seek-button:hover {
    background: rgba(255, 77, 77, 0.3) !important;
  }
  
  /* Tùy biến cho mobile */
  @media (max-width: 768px) {
    .vds-controls {
      padding-bottom: 8px !important;
    }
    
    .vds-play-button {
      width: 48px !important;
      height: 48px !important;
    }
  }
  
  /* Animation cho controls */
  .vds-controls[data-visible] {
    transition: opacity 0.3s ease-in-out;
  }
`;

// Component tùy biến layout với Vidstack icons
const CustomVideoLayout = ({ player, movieInfo, ...props }) => {
  const [volume, setVolume] = useState(1);
  
  // Tạo icons tùy chỉnh dựa trên defaultLayoutIcons
  const customIcons = {
    ...defaultLayoutIcons,
    // Override một số icons nếu muốn
    play: <PlayIcon />,
    pause: <PauseIcon />,
    replay: <ReplayIcon />,
    mute: <MuteIcon />,
    volumeLow: <VolumeLowIcon />,
    volumeHigh: <VolumeHighIcon />,
    settings: <SettingsMenuIcon />,
    chapters: <ChapterMenuIcon />,
    audio: <AudioMenuIcon />,
    radio: <RadioMenuIcon />,
    captions: <ClosedCaptionsIcon />,
    pipEnter: <PIPEnterIcon />,
    pipExit: <PIPExitIcon />,
    fullscreenEnter: <FullscreenEnterIcon />,
    fullscreenExit: <FullscreenExitIcon />,
    seekBackward10: <SeekBackwardIcon seconds={10} />,
    seekForward10: <SeekForward10Icon />,
    seekForward15: <SeekForward15Icon />,
    seekForward30: <SeekForward30Icon />,
  };
  
  return (
    <>
      <DefaultVideoLayout 
        icons={customIcons}
        // Cấu hình layout chi tiết
        defaultQuality="auto"
        defaultPlaybackRate={1}
        colorScheme="dark"
        noGestures={false}
        noScrubGesture={false}
        // Thumbnails cho preview khi di chuột
        thumbnails={movieInfo?.thumbnails}
        // Custom menu items
        slots={{
          // Thêm nút seek 10s trước/sau
          'before-seek-buttons': (
            <button 
              className="vds-button vds-seek-button"
              onClick={() => player.current?.seekBy(-10)}
              title="Lùi 10 giây"
            >
              <SeekBackwardIcon seconds={10} />
            </button>
          ),
          'after-seek-buttons': (
            <button 
              className="vds-button vds-seek-button"
              onClick={() => player.current?.seekBy(10)}
              title="Tiến 10 giây"
            >
              <SeekForward10Icon />
            </button>
          ),
          // Thêm nút chất lượng nếu muốn custom
          'after-settings-menu': (
            <button 
              className="vds-button"
              onClick={() => {
                // Mở menu chất lượng Vidstack
                const menu = document.querySelector('[data-menu="quality"]');
                menu?.click();
              }}
              title="Chất lượng video"
            >
              <SettingsMenuIcon />
            </button>
          )
        }}
        {...props}
      />
      
      {/* Volume control dọc tùy chỉnh - vẫn giữ Vidstack volume control mặc định */}
      <Box sx={{ 
        position: 'absolute', 
        right: 16, 
        top: '50%', 
        transform: 'translateY(-50%)',
        bgcolor: 'rgba(0,0,0,0.7)',
        borderRadius: 4,
        p: 1,
        display: { xs: 'none', md: 'block' },
        zIndex: 10
      }}>
        <Slider
          orientation="vertical"
          value={volume * 100}
          onChange={(_, value) => {
            setVolume(value / 100);
            player.current.volume = value / 100;
          }}
          sx={{
            height: 100,
            color: '#ff4d4d',
            '& .MuiSlider-thumb': {
              width: 16,
              height: 16,
              bgcolor: 'white',
              '&:hover': {
                boxShadow: '0 0 0 8px rgba(255,77,77,0.2)'
              }
            }
          }}
        />
      </Box>
    </>
  );
};

const VideoPlayer = ({ src, title, movieInfo, onVideoEnd }) => {
  const player = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const proxiedUrl = `/proxy-stream?url=${encodeURIComponent(src)}`;
  
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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!player.current) return;
      
      // Tránh conflict với các phím tắt trình duyệt
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      switch(e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          player.current.paused ? player.current.play() : player.current.pause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          player.current.currentTime -= 10;
          break;
        case 'ArrowRight':
          e.preventDefault();
          player.current.currentTime += 10;
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          document.fullscreenElement ? document.exitFullscreen() : player.current.el.requestFullscreen();
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          player.current.muted = !player.current.muted;
          break;
        case '0':
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
          e.preventDefault();
          const percent = parseInt(e.key) / 10;
          player.current.currentTime = player.current.duration * percent;
          break;
        default:
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <>
      <style>{customStyles}</style>
      <Card sx={{ 
        mt: 2, 
        bgcolor: "#000", 
        color: "white", 
        boxShadow: 0,
        position: 'relative',
        borderRadius: 2,
        overflow: 'hidden'
      }}>
        {title && (
          <Box sx={{ 
            p: 2, 
            bgcolor: "rgba(26, 26, 26, 0.95)",
            borderBottom: '1px solid rgba(255,77,77,0.3)'
          }}>
            <Typography variant="h6">{title}</Typography>
          </Box>
        )}

        <Box sx={{ 
          width: "100%", 
          maxWidth: 960, 
          margin: "0 auto",
          position: 'relative'
        }}>
          <MediaPlayer
            ref={player}
            src={proxiedUrl}
            viewType="video"
            streamType="on-demand"
            playsInline
            autoplay
            crossOrigin="anonymous"
            onEnded={onVideoEnd}
            onCanPlay={() => {
              if (movieInfo?.currentTime > 0 && player.current) {
                player.current.currentTime = movieInfo.currentTime;
              }
            }}
            onFullscreenChange={({ detail }) => setIsFullscreen(detail)}
            // Cấu hình nâng cao
            load="visible"
            live={false}
            minLiveDVRWindow={0}
            posterLoad="eager"
            // Volume control
            defaultVolume={1}
            // Playback quality
            autoQuality={true}
            // Captions
            autoCaptions={true}
            // Lưu cài đặt vào localStorage
            storage="video-player-settings"
            // Các tùy chọn khác
            aspectRatio={16/9}
          >
            <MediaProvider>
              {movieInfo?.thumb && (
                <Poster
                  src={movieInfo.thumb}
                  alt={movieInfo.name}
                  className="vds-poster"
                />
              )}
            </MediaProvider>

            {/* Sử dụng custom layout với Vidstack icons */}
            <CustomVideoLayout 
              player={player}
              movieInfo={movieInfo}
              // Các props cho layout
              colorScheme="dark"
              noGestures={false}
              thumbnails={movieInfo?.thumbnails}
              // Custom messages - hỗ trợ tiếng Việt
              translations={{
                'Quality': 'Chất lượng',
                'Playback Speed': 'Tốc độ phát',
                'Settings': 'Cài đặt',
                'Enter Fullscreen': 'Toàn màn hình',
                'Exit Fullscreen': 'Thoát toàn màn hình',
                'Mute': 'Tắt tiếng',
                'Unmute': 'Bật tiếng',
                'Play': 'Phát',
                'Pause': 'Tạm dừng',
                'Replay': 'Phát lại',
                'Seek': 'Tua',
                'Captions': 'Phụ đề',
                'Audio': 'Âm thanh',
                'Chapters': 'Chương',
                'Normal': 'Bình thường',
                'Off': 'Tắt',
                'Auto': 'Tự động'
              }}
            />
          </MediaPlayer>
        </Box>
      </Card>
    </>
  );
};

export default VideoPlayer;
