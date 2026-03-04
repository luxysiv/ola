import React, { useEffect, useRef, useState } from 'react';
import { MediaPlayer, MediaProvider, Poster } from '@vidstack/react';
import { DefaultVideoLayout, defaultLayoutIcons } from '@vidstack/react/player/layouts/default';

import '@vidstack/react/player/styles/default/theme.css';
import '@vidstack/react/player/styles/default/layouts/video.css';

import Replay10Icon from '@mui/icons-material/Replay10';
import Forward10Icon from '@mui/icons-material/Forward10';

import { Card, Box, Typography } from "@mui/material";
import { saveHistoryItem } from "../utils/history";

const VideoPlayer = ({ src, title, movieInfo, onVideoEnd }) => {
  const player = useRef(null);

  const [seekUI, setSeekUI] = useState(null);
  const seekTimeout = useRef(null);
  const seekAccumulated = useRef(0);
  const seekSide = useRef(null);

  const proxiedUrl = src
    ? `/proxy-stream?url=${encodeURIComponent(src)}`
    : '';

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

  const handleDoubleTap = (event) => {
    const playerEl = player.current?.el;
    if (!playerEl) return;

    const rect = playerEl.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const isLeft = x < rect.width / 2;
    const amount = 10;

    if (seekSide.current === (isLeft ? "left" : "right")) {
      seekAccumulated.current += amount;
    } else {
      seekAccumulated.current = amount;
    }

    seekSide.current = isLeft ? "left" : "right";

    if (isLeft) {
      player.current.currentTime -= amount;
    } else {
      player.current.currentTime += amount;
    }

    setSeekUI({
      side: seekSide.current,
      value: seekAccumulated.current
    });

    clearTimeout(seekTimeout.current);
    seekTimeout.current = setTimeout(() => {
      setSeekUI(null);
      seekAccumulated.current = 0;
      seekSide.current = null;
    }, 700);
  };

  return (
    <Card sx={{ mt: 2, bgcolor: "#000", boxShadow: 0 }}>
      {title && (
        <Box sx={{ p: 2, bgcolor: "#1a1a1a", color: "white" }}>
          <Typography variant="h6">{title}</Typography>
        </Box>
      )}

      <Box sx={{ width: "100%", maxWidth: 960, margin: "0 auto", bgcolor: "black" }}>
        <MediaPlayer
          ref={player}
          src={proxiedUrl}
          viewType="video"
          streamType="on-demand"
          playsInline
          autoplay
          onEnded={onVideoEnd}
          onDblClick={handleDoubleTap}
          style={{ position: "relative" }}
        >
          <MediaProvider>
            {movieInfo?.poster && (
              <Poster
                src={movieInfo.thumb}
                alt={movieInfo.name}
              />
            )}
          </MediaProvider>

          {seekUI && (
            <div className={`seek-overlay ${seekUI.side}`}>
              <div className="seek-circle">
                {seekUI.side === "left" ? (
                  <Replay10Icon sx={{ fontSize: 42 }} />
                ) : (
                  <Forward10Icon sx={{ fontSize: 42 }} />
                )}
                <span>
                  {seekUI.side === "left" ? "-" : "+"}
                  {seekUI.value}s
                </span>
              </div>
            </div>
          )}

          <DefaultVideoLayout icons={defaultLayoutIcons} />
        </MediaPlayer>
      </Box>

      <style jsx global>{`
        .seek-overlay {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
        }

        .seek-overlay.left {
          left: 0;
        }

        .seek-overlay.right {
          right: 0;
        }

        .seek-circle {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          background: rgba(0,0,0,0.65);
          backdrop-filter: blur(6px);
          color: white;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          animation: seekPop 0.25s ease;
        }

        .seek-circle span {
          margin-top: 6px;
          font-size: 20px;
        }

        @keyframes seekPop {
          from {
            opacity: 0;
            transform: scale(0.6);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </Card>
  );
};

export default VideoPlayer;
