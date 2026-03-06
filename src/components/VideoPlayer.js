import React, { useEffect, useRef, useState } from "react";
import { MediaPlayer, MediaProvider, Poster } from "@vidstack/react";
import {
  DefaultVideoLayout,
  defaultLayoutIcons,
} from "@vidstack/react/player/layouts/default";

import "@vidstack/react/player/styles/default/theme.css";
import "@vidstack/react/player/styles/default/layouts/video.css";

import { Card, Box, Typography } from "@mui/material";
// import { saveHistoryItem } from "../utils/history";

const SeekArrows = ({ direction }) => (
  <Box sx={{ display: 'flex', flexDirection: direction === 'left' ? 'row-reverse' : 'row', gap: '2px', mb: 0.5 }}>
    {[0, 1, 2].map((i) => (
      <Box
        key={i}
        sx={{
          width: 0, height: 0,
          borderTop: '6px solid transparent',
          borderBottom: '6px solid transparent',
          [direction === 'right' ? 'borderLeft' : 'borderRight']: '8px solid white',
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
  
  // Dùng state này để render UI hiển thị số giây
  const [displaySeek, setDisplaySeek] = useState({ side: null, value: 0 });
  const [speedOverlay, setSpeedOverlay] = useState(false);
  
  // Biến ref để tính toán cộng dồn chính xác không bị delay bởi re-render
  const accumulator = useRef(0);

  const proxiedUrl = `/proxy-stream?url=${encodeURIComponent(src)}`;

  // Nhấn giữ x2
  const handlePointerDown = (e) => {
    if (e.button !== 0 && e.pointerType !== 'mouse' && e.pointerType !== 'touch') return;
    clearTimeout(holdTimer.current);
    holdTimer.current = setTimeout(() => {
      if (player.current) {
        player.current.playbackRate = 2;
        setSpeedOverlay(true);
      }
    }, 400);
  };

  const stopSpeedUp = () => {
    clearTimeout(holdTimer.current);
    if (player.current) player.current.playbackRate = 1;
    setSpeedOverlay(false);
  };

  // Hàm Tua cộng dồn (YouTube Style)
  const seekVideo = (direction) => {
    if (!player.current) return;

    const side = direction === "forward" ? "right" : "left";
    
    // Nếu đổi bên đột ngột thì reset số giây
    if (displaySeek.side !== side && displaySeek.side !== null) {
      accumulator.current = 10;
    } else {
      accumulator.current += 10;
    }

    // Thực hiện tua trên player
    player.current.currentTime += (direction === "forward" ? 10 : -10);

    // Cập nhật UI để hiện số kèm dấu +/-
    setDisplaySeek({
      side: side,
      value: accumulator.current
    });

    // Reset sau 800ms nếu không bấm nữa
    clearTimeout(seekTimer.current);
    seekTimer.current = setTimeout(() => {
      accumulator.current = 0;
      setDisplaySeek({ side: null, value: 0 });
    }, 800);
  };

  return (
    <Card sx={{ mt: 2, bgcolor: "#000", color: "white", boxShadow: 0, overflow: 'hidden' }}>
      <Box sx={{ width: "100%", maxWidth: 960, margin: "0 auto", position: "relative" }}>
        <MediaPlayer
          ref={player}
          src={proxiedUrl}
          viewType="video"
          onPointerDown={handlePointerDown}
          onPointerUp={stopSpeedUp}
          onPointerCancel={stopSpeedUp}
          onPointerLeave={stopSpeedUp}
          style={{ touchAction: 'none', userSelect: 'none' }}
        >
          <MediaProvider />

          {/* Vùng Tap Zones (Tách biệt để bắt Double Click chuẩn) */}
          <Box sx={{ position: "absolute", inset: 0, display: "flex", zIndex: 10, pointerEvents: 'none' }}>
            {/* LÙI LẠI */}
            <Box 
              sx={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'auto' }} 
              onDoubleClick={(e) => { e.stopPropagation(); seekVideo("back"); }}
            >
              {displaySeek.side === "left" && (
                <Box className="seek-ui left">
                  <Box className="ripple" />
                  <SeekArrows direction="left" />
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>-{displaySeek.value}s</Typography>
                </Box>
              )}
            </Box>

            <Box sx={{ width: "20%" }} />

            {/* TIẾN TỚI */}
            <Box 
              sx={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'auto' }} 
              onDoubleClick={(e) => { e.stopPropagation(); seekVideo("forward"); }}
            >
              {displaySeek.side === "right" && (
                <Box className="seek-ui right">
                  <Box className="ripple" />
                  <SeekArrows direction="right" />
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>+{displaySeek.value}s</Typography>
                </Box>
              )}
            </Box>
          </Box>

          {/* Overlay 2x */}
          {speedOverlay && (
            <Box sx={{ position: "absolute", top: 20, left: "50%", transform: "translateX(-50%)", bgcolor: "rgba(0,0,0,0.6)", px: 2, borderRadius: 10, zIndex: 20 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>2X Speed ⚡</Typography>
            </Box>
          )}

          <DefaultVideoLayout icons={defaultLayoutIcons} />
        </MediaPlayer>
      </Box>

      <style>
        {`
        .seek-ui {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          width: 100%; height: 100%; z-index: 11;
        }
        .ripple {
          position: absolute; width: 140%; height: 100%;
          background: radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%);
          animation: rippleFade 0.8s ease-out forwards;
        }
        .left .ripple { right: 0; border-radius: 0 500px 500px 0; }
        .right .ripple { left: 0; border-radius: 500px 0 0 500px; }

        @keyframes rippleFade {
          0% { opacity: 0; transform: scale(0.8); }
          20% { opacity: 1; }
          100% { opacity: 0; transform: scale(1.1); }
        }
        @keyframes arrowsBlink {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 1; }
        }
        `}
      </style>
    </Card>
  );
};

export default VideoPlayer;
