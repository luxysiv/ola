import React, { useEffect, useRef, useState } from "react";
import { MediaPlayer, MediaProvider, Poster } from "@vidstack/react";
import {
  DefaultVideoLayout,
  defaultLayoutIcons,
} from "@vidstack/react/player/layouts/default";

import "@vidstack/react/player/styles/default/theme.css";
import "@vidstack/react/player/styles/default/layouts/video.css";

import { Card, Box, Typography } from "@mui/material";
import { saveHistoryItem } from "../utils/history";

// Icon mũi tên tùy chỉnh giống YouTube
const SeekArrows = ({ direction }) => (
  <Box sx={{ display: 'flex', flexDirection: direction === 'left' ? 'row-reverse' : 'row', gap: '-4px' }}>
    {[0, 1, 2].map((i) => (
      <Box
        key={i}
        sx={{
          width: 0,
          height: 0,
          borderTop: '8px solid transparent',
          borderBottom: '8px solid transparent',
          [direction === 'right' ? 'borderLeft' : 'borderRight']: '10px solid white',
          animation: `arrowsBlink 0.6s infinite ${i * 0.1}s`,
        }}
      />
    ))}
  </Box>
);

const VideoPlayer = ({ src, title, movieInfo, onVideoEnd }) => {
  const player = useRef(null);
  const holdTimer = useRef(null);
  const seekTimer = useRef(null);
  
  const [seekData, setSeekData] = useState({ side: null, seconds: 0 }); // Lưu trạng thái tua
  const [speedOverlay, setSpeedOverlay] = useState(false);

  const proxiedUrl = `/proxy-stream?url=${encodeURIComponent(src)}`;

  useEffect(() => {
    if (!movieInfo) return;
    const interval = setInterval(() => {
      const activePlayer = player.current;
      if (activePlayer && !activePlayer.paused) {
        saveHistoryItem({
          ...movieInfo,
          currentTime: Math.floor(activePlayer.currentTime),
          updatedAt: Date.now(),
        });
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [movieInfo]);

  const handlePointerDown = () => {
    clearTimeout(holdTimer.current);
    holdTimer.current = setTimeout(() => {
      if (player.current) {
        player.current.playbackRate = 2;
        setSpeedOverlay(true);
      }
    }, 400); // Tăng lên 400ms để không bị nhầm với double tap
  };

  const handlePointerUp = () => {
    clearTimeout(holdTimer.current);
    if (player.current) player.current.playbackRate = 1;
    setSpeedOverlay(false);
  };

  const seekVideo = (direction) => {
    if (!player.current) return;

    const step = 10;
    player.current.currentTime += direction === "forward" ? step : -step;

    // Cộng dồn số giây nếu nhấn liên tục
    setSeekData(prev => ({
      side: direction === "forward" ? "right" : "left",
      seconds: prev.side === (direction === "forward" ? "right" : "left") 
                ? prev.seconds + step 
                : step
    }));

    clearTimeout(seekTimer.current);
    seekTimer.current = setTimeout(() => {
      setSeekData({ side: null, seconds: 0 });
    }, 800);
  };

  return (
    <Card sx={{ mt: 2, bgcolor: "#000", color: "white", boxShadow: 0, position: 'relative' }}>
      {title && (
        <Box sx={{ p: 2, bgcolor: "#1a1a1a" }}>
          <Typography variant="h6">{title}</Typography>
        </Box>
      )}

      <Box sx={{ width: "100%", maxWidth: 960, margin: "0 auto", position: "relative" }}>
        <MediaPlayer
          ref={player}
          src={proxiedUrl}
          viewType="video"
          streamType="on-demand"
          playsInline
          autoplay
          crossOrigin
          load="eager"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerLeave={handlePointerUp}
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

          {/* Vùng tương tác Double Tap */}
          <Box sx={{ position: "absolute", inset: 0, display: "flex", zIndex: 10 }}>
            <Box 
              sx={{ 
                width: "45%", 
                position: 'relative',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }} 
              onDoubleClick={() => seekVideo("back")}
            >
              {/* Overlay bên trái */}
              {seekData.side === "left" && (
                <Box className="seek-container left">
                  <Box className="ripple-circle" />
                  <SeekArrows direction="left" />
                  <Typography sx={{ fontWeight: 'bold', mt: 1 }}>{seekData.seconds} giây</Typography>
                </Box>
              )}
            </Box>

            <Box sx={{ width: "10%" }} />

            <Box 
              sx={{ 
                width: "45%", 
                position: 'relative',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }} 
              onDoubleClick={() => seekVideo("forward")}
            >
              {/* Overlay bên phải */}
              {seekData.side === "right" && (
                <Box className="seek-container right">
                  <Box className="ripple-circle" />
                  <SeekArrows direction="right" />
                  <Typography sx={{ fontWeight: 'bold', mt: 1 }}>{seekData.seconds} giây</Typography>
                </Box>
              )}
            </Box>
          </Box>

          {/* Hiển thị Tốc độ 2x ở trên cùng giữa */}
          {speedOverlay && (
            <Box
              sx={{
                position: "absolute",
                top: 60,
                left: "50%",
                transform: "translateX(-50%)",
                bgcolor: "rgba(0,0,0,0.6)",
                px: 2, py: 0.5,
                borderRadius: 10,
                zIndex: 20,
                pointerEvents: 'none'
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Gấp đôi tốc độ ⚡</Typography>
            </Box>
          )}

          <DefaultVideoLayout icons={defaultLayoutIcons} />
        </MediaPlayer>
      </Box>

      <style>
        {`
        .seek-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          z-index: 11;
          pointer-events: none;
        }

        /* Hiệu ứng vòng tròn lan tỏa */
        .ripple-circle {
          position: absolute;
          width: 200%;
          height: 150%;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 50%;
          animation: rippleEffect 0.8s ease-out forwards;
        }
        
        .left .ripple-circle { right: 0; border-top-right-radius: 500px; border-bottom-right-radius: 500px; }
        .right .ripple-circle { left: 0; border-top-left-radius: 500px; border-bottom-left-radius: 500px; }

        @keyframes rippleEffect {
          0% { opacity: 0; transform: scale(0.5); }
          30% { opacity: 1; }
          100% { opacity: 0; transform: scale(1.2); }
        }

        @keyframes arrowsBlink {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        `}
      </style>
    </Card>
  );
};

export default VideoPlayer;
