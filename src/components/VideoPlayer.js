import React, { useRef, useEffect, useState, useCallback } from "react";
import Hls from "hls.js";
import { Card, Box, Typography, Slider, IconButton, Tooltip } from "@mui/material";
import { saveHistoryItem } from "../utils/history";
import { useGesture } from "@use-gesture/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BrightnessHigh,
  BrightnessLow,
  VolumeUp,
  VolumeDown,
  VolumeOff,
  Forward10,
  Replay10,
  Fullscreen,
  FullscreenExit,
  PlayArrow,
  Pause,
  SkipNext,
  SkipPrevious,
  Settings
} from "@mui/icons-material";

// Màu đỏ thương hiệu YouTube
const YT_RED = "#FF0000";

const VideoPlayer = ({ 
  src, 
  title, 
  movieInfo, 
  onVideoEnd,
  episodeList = [],
  currentEpisode,
  onPrevEpisode,
  onNextEpisode 
}) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const hlsRef = useRef(null);
  const hasResumed = useRef(false);
  const controlsTimeoutRef = useRef(null);
  
  const [showControls, setShowControls] = useState(true);
  const [brightness, setBrightness] = useState(100);
  const [volume, setVolume] = useState(1);
  const [prevVolume, setPrevVolume] = useState(1);
  const [showSeekIndicator, setShowSeekIndicator] = useState(false);
  const [seekDirection, setSeekDirection] = useState(null);
  const [showVolumeIndicator, setShowVolumeIndicator] = useState(false);
  const [showBrightnessIndicator, setShowBrightnessIndicator] = useState(false);
  const [waveformBars, setWaveformBars] = useState([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  const generateWaveform = useCallback(() => {
    const bars = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      height: Math.random() * 40 + 10,
      delay: i * 0.02,
    }));
    setWaveformBars(bars);
    setTimeout(() => setWaveformBars([]), 800);
  }, []);

  const handleDoubleTap = (direction) => {
    if (!videoRef.current) return;
    const seekTime = direction === 'forward' ? 10 : -10;
    videoRef.current.currentTime = Math.max(0, Math.min(videoRef.current.duration, videoRef.current.currentTime + seekTime));
    
    setSeekDirection(direction);
    setShowSeekIndicator(true);
    generateWaveform();
    setTimeout(() => setShowSeekIndicator(false), 800);
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => console.error(err));
    } else {
      document.exitFullscreen();
    }
  };

  // Lắng nghe sự kiện thay đổi fullscreen (quan trọng để cập nhật UI nút bấm)
  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const handleSeek = (seconds) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime += seconds;
  };

  const changePlaybackSpeed = (speed) => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = speed;
    setPlaybackSpeed(speed);
    setShowSettings(false);
  };

  const bindGestures = useGesture(
    {
      onDrag: ({ movement: [mx, my], last, event, xy: [clientX, clientY] }) => {
        const container = containerRef.current;
        if (!container) return;

        const rect = container.getBoundingClientRect();
        const relativeX = clientX - rect.left;
        const width = rect.width;

        const leftZone = width * 0.25;
        const rightZone = width * 0.75;

        if (relativeX < leftZone) {
          const delta = -my / 200;
          setBrightness(prev => {
            const val = Math.max(20, Math.min(150, prev + delta * 2));
            return val;
          });
          setShowBrightnessIndicator(true);
          if (last) setTimeout(() => setShowBrightnessIndicator(false), 1000);
        } else if (relativeX > rightZone) {
          const delta = -my / 200;
          setVolume(prev => {
            const newVol = Math.max(0, Math.min(1, prev + delta));
            if (videoRef.current) videoRef.current.volume = newVol;
            return newVol;
          });
          setShowVolumeIndicator(true);
          if (last) setTimeout(() => setShowVolumeIndicator(false), 1000);
        }
      },
    },
    { drag: { filterTaps: true, axis: 'y', threshold: 10 } }
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let lastTap = 0;
    const handleTouchEnd = (e) => {
      const now = new Date().getTime();
      const timesincelast = now - lastTap;
      if (timesincelast < 300 && timesincelast > 0) {
        e.preventDefault();
        const touch = e.changedTouches[0];
        const rect = video.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        x < rect.width / 2 ? handleDoubleTap('backward') : handleDoubleTap('forward');
      }
      lastTap = now;
    };

    video.addEventListener('touchend', handleTouchEnd);
    return () => video.removeEventListener('touchend', handleTouchEnd);
  }, []);

  useEffect(() => {
    const resetTimer = () => {
      setShowControls(true);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      if (isPlaying) {
        controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
      }
    };
    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', resetTimer);
      container.addEventListener('touchstart', resetTimer);
    }
    return () => {
      if (container) {
        container.removeEventListener('mousemove', resetTimer);
        container.removeEventListener('touchstart', resetTimer);
      }
      clearTimeout(controlsTimeoutRef.current);
    };
  }, [isPlaying]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const syncState = () => {
      setCurrentTime(video.currentTime);
      setDuration(video.duration || 0);
      setIsPlaying(!video.paused);
    };

    video.addEventListener('timeupdate', syncState);
    video.addEventListener('play', syncState);
    video.addEventListener('pause', syncState);
    video.addEventListener('ended', onVideoEnd || (() => {}));
    
    return () => {
      video.removeEventListener('timeupdate', syncState);
      video.removeEventListener('play', syncState);
      video.removeEventListener('pause', syncState);
    };
  }, [onVideoEnd]);

  useEffect(() => {
    if (!videoRef.current || !src) return;
    const video = videoRef.current;
    hasResumed.current = false;

    if (Hls.isSupported()) {
      const hls = new Hls({ capLevelToPlayerSize: true });
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });
      hlsRef.current = hls;
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
    }

    return () => {
      if (hlsRef.current) hlsRef.current.destroy();
    };
  }, [src]);

  const toggleMute = () => {
    if (!videoRef.current) return;
    if (isMuted) {
      videoRef.current.volume = prevVolume || 0.5;
      setVolume(prevVolume || 0.5);
    } else {
      setPrevVolume(volume);
      videoRef.current.volume = 0;
      setVolume(0);
    }
    setIsMuted(!isMuted);
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return "0:00";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return h > 0 ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}` : `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <Card sx={{ mt: 2, bgcolor: "#0f0f0f", color: "white", borderRadius: 2, overflow: "hidden" }}>
      <Box 
        ref={containerRef}
        sx={{ 
          width: "100%", 
          bgcolor: "black", 
          aspectRatio: "16/9",
          position: "relative",
          overflow: "hidden",
          cursor: showControls ? "default" : "none",
        }}
        {...bindGestures()}
      >
        <video
          ref={videoRef}
          playsInline
          style={{ 
            width: "100%", height: "100%", objectFit: "contain",
            filter: `brightness(${brightness}%)`,
          }}
          onClick={togglePlay}
        />

        {/* Center Play/Pause Overlay */}
        <AnimatePresence>
          {!isPlaying && (
            <Box 
                component={motion.div}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={togglePlay}
                sx={{
                    position: "absolute", top: "50%", left: "50%",
                    transform: "translate(-50%, -50%)",
                    bgcolor: "rgba(0,0,0,0.5)", borderRadius: "50%",
                    p: 2, zIndex: 10, cursor: "pointer"
                }}
            >
              <PlayArrow sx={{ fontSize: 60, color: "white" }} />
            </Box>
          )}
        </AnimatePresence>

        {/* Seek Feedback */}
        <AnimatePresence>
          {showSeekIndicator && (
            <Box 
                component={motion.div}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                sx={{
                    position: "absolute", top: "50%", 
                    left: seekDirection === 'backward' ? "20%" : "80%",
                    transform: "translate(-50%, -50%)",
                    bgcolor: "rgba(0,0,0,0.6)", borderRadius: "50%",
                    width: 80, height: 80, display: "flex", 
                    flexDirection: "column", alignItems: "center", justifyContent: "center",
                    zIndex: 11
                }}
            >
              <Typography variant="h6" sx={{ color: "white", fontWeight: 'bold' }}>
                {seekDirection === 'forward' ? '>>' : '<<'}
              </Typography>
              <Typography variant="caption">10s</Typography>
            </Box>
          )}
        </AnimatePresence>

        {/* Indicators Sidebar */}
        <AnimatePresence>
          {showBrightnessIndicator && (
            <Box component={motion.div} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                 sx={{ position: "absolute", left: 20, top: "50%", transform: "translateY(-50%)", bgcolor: "rgba(0,0,0,0.8)", p: 1, borderRadius: 1, zIndex: 40, textAlign: 'center' }}>
              <BrightnessHigh fontSize="small" />
              <Typography variant="caption" display="block">{Math.round(brightness)}%</Typography>
            </Box>
          )}
        </AnimatePresence>

        {/* Control Bar */}
        <AnimatePresence>
          {showControls && (
            <Box
              component={motion.div}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              sx={{
                position: "absolute", bottom: 0, left: 0, right: 0,
                background: "linear-gradient(transparent, rgba(0,0,0,0.9))",
                px: 2, pb: 1, pt: 4, zIndex: 50
              }}
            >
              {/* Progress Slider */}
              <Slider
                size="small"
                value={currentTime}
                max={duration || 100}
                onChange={(_, val) => { if (videoRef.current) videoRef.current.currentTime = val; }}
                sx={{
                  color: YT_RED,
                  height: 4,
                  padding: "13px 0",
                  "& .MuiSlider-thumb": {
                    width: 12, height: 12,
                    display: currentTime === 0 ? "none" : "block",
                    "&:hover, &.Mui-active": { boxShadow: `0 0 0 8px rgba(255, 0, 0, 0.16)` }
                  },
                  "& .MuiSlider-rail": { opacity: 0.3, bgcolor: "#fff" },
                }}
              />

              <Box sx={{ display: "flex", alignItems: "center", mt: -1 }}>
                <IconButton onClick={togglePlay} sx={{ color: "white" }}>
                  {isPlaying ? <Pause /> : <PlayArrow />}
                </IconButton>
                
                <IconButton onClick={onNextEpisode} disabled={!onNextEpisode} sx={{ color: "white" }}>
                  <SkipNext />
                </IconButton>

                <Box sx={{ display: "flex", alignItems: "center", ml: 1, gap: 1 }}>
                    <IconButton onClick={toggleMute} size="small" sx={{ color: "white" }}>
                        {isMuted || volume === 0 ? <VolumeOff /> : volume < 0.5 ? <VolumeDown /> : <VolumeUp />}
                    </IconButton>
                    <Slider 
                        value={isMuted ? 0 : volume}
                        min={0} max={1} step={0.05}
                        onChange={(_, val) => {
                            setVolume(val);
                            if(videoRef.current) videoRef.current.volume = val;
                            setIsMuted(val === 0);
                        }}
                        sx={{ width: 60, color: "white", "& .MuiSlider-thumb": { width: 10, height: 10 } }}
                    />
                </Box>

                <Typography variant="caption" sx={{ ml: 2, color: "#ddd" }}>
                  {formatTime(currentTime)} / {formatTime(duration)}
                </Typography>

                <Box sx={{ flexGrow: 1 }} />

                <IconButton onClick={() => setShowSettings(!showSettings)} sx={{ color: "white" }}>
                  <Settings sx={{ transform: showSettings ? "rotate(45deg)" : "none", transition: "0.2s" }} />
                </IconButton>

                <IconButton onClick={toggleFullscreen} sx={{ color: "white" }}>
                  {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
                </IconButton>
              </Box>

              {/* Speed Menu Overlay */}
              {showSettings && (
                <Box sx={{ position: "absolute", bottom: 70, right: 20, bgcolor: "rgba(28,28,28,0.95)", borderRadius: 1, p: 1, minWidth: 120, border: "1px solid #333" }}>
                  <Typography variant="overline" sx={{ px: 1, color: "#aaa" }}>Tốc độ phát</Typography>
                  {[0.5, 1, 1.5, 2].map(speed => (
                    <Box 
                        key={speed} 
                        onClick={() => changePlaybackSpeed(speed)}
                        sx={{ 
                            p: 1, cursor: "pointer", borderRadius: 0.5,
                            bgcolor: playbackSpeed === speed ? "rgba(255,255,255,0.1)" : "transparent",
                            color: playbackSpeed === speed ? YT_RED : "white",
                            "&:hover": { bgcolor: "rgba(255,255,255,0.2)" }
                        }}
                    >
                      <Typography variant="body2">{speed === 1 ? "Chuẩn" : `${speed}x`}</Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          )}
        </AnimatePresence>
      </Box>
      
      {/* Footer Info */}
      <Box sx={{ p: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="subtitle1" fontWeight="bold">{title || "Đang phát..."}</Typography>
        <Typography variant="caption" sx={{ opacity: 0.6 }}>{currentEpisode}</Typography>
      </Box>
    </Card>
  );
};

export default VideoPlayer;
