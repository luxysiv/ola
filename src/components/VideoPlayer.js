import React, { useRef, useEffect, useState, useCallback } from "react";
import Hls from "hls.js";
import { Card, Box, Typography, Slider, IconButton } from "@mui/material";
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
  
  // State cho UI
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
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  // Tạo waveform animation khi double tap
  const generateWaveform = useCallback(() => {
    const bars = [];
    for (let i = 0; i < 20; i++) {
      bars.push({
        id: i,
        height: Math.random() * 40 + 10,
        delay: i * 0.02,
      });
    }
    setWaveformBars(bars);
    setTimeout(() => setWaveformBars([]), 800);
  }, []);

  // Xử lý double tap để tua
  const handleDoubleTap = (direction) => {
    if (!videoRef.current) return;
    
    const video = videoRef.current;
    const seekTime = direction === 'forward' ? 10 : -10;
    video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + seekTime));
    
    setSeekDirection(direction);
    setShowSeekIndicator(true);
    generateWaveform();
    setTimeout(() => setShowSeekIndicator(false), 800);
  };

  // Xử lý play/pause
  const togglePlay = () => {
    if (!videoRef.current) return;
    
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  // Xử lý fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Xử lý tua
  const handleSeek = (seconds) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime += seconds;
  };

  // Xử lý thay đổi tốc độ phát
  const changePlaybackSpeed = (speed) => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = speed;
    setPlaybackSpeed(speed);
  };

  // Xử lý kéo để điều chỉnh brightness/volume
  const bindGestures = useGesture(
    {
      onDrag: ({ movement: [mx, my], first, last, event }) => {
        event.preventDefault();
        const { clientX, clientY } = event;
        const container = containerRef.current;
        if (!container) return;

        const rect = container.getBoundingClientRect();
        const relativeX = clientX - rect.left;
        const width = rect.width;

        // Xác định vùng kéo (trái 20% cho brightness, phải 20% cho volume)
        if (relativeX < width * 0.2) {
          // Điều chỉnh brightness
          const delta = -my / 200;
          const newBrightness = Math.max(20, Math.min(150, brightness + delta * 50));
          setBrightness(newBrightness);
          setShowBrightnessIndicator(true);
          if (last) setTimeout(() => setShowBrightnessIndicator(false), 1000);
        } else if (relativeX > width * 0.8) {
          // Điều chỉnh volume
          const delta = -my / 200;
          let newVolume = Math.max(0, Math.min(1, volume + delta));
          setVolume(newVolume);
          if (videoRef.current) {
            videoRef.current.volume = newVolume;
          }
          setShowVolumeIndicator(true);
          if (last) setTimeout(() => setShowVolumeIndicator(false), 1000);
        }
      },
    },
    {
      drag: {
        filterTaps: true,
        axis: 'y',
        pointer: { touch: true }
      }
    }
  );

  // Xử lý double tap bằng touch events
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let lastTap = 0;
    let tapTimeout;

    const handleTouchEnd = (e) => {
      const currentTime = new Date().getTime();
      const tapLength = currentTime - lastTap;
      
      if (tapLength < 300 && tapLength > 0) {
        // Double tap detected
        e.preventDefault();
        const touch = e.changedTouches[0];
        const rect = video.getBoundingClientRect();
        const touchX = touch.clientX - rect.left;
        
        if (touchX < rect.width / 2) {
          handleDoubleTap('backward');
        } else {
          handleDoubleTap('forward');
        }
        
        clearTimeout(tapTimeout);
      }
      
      lastTap = currentTime;
      
      tapTimeout = setTimeout(() => {
        lastTap = 0;
      }, 300);
    };

    video.addEventListener('touchend', handleTouchEnd);
    return () => {
      video.removeEventListener('touchend', handleTouchEnd);
      clearTimeout(tapTimeout);
    };
  }, []);

  // Auto hide controls
  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);
      
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      
      controlsTimeoutRef.current = setTimeout(() => {
        if (isPlaying) {
          setShowControls(false);
        }
      }, 3000);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('mouseleave', () => setShowControls(true));
    }

    return () => {
      if (container) {
        container.removeEventListener('mousemove', handleMouseMove);
        container.removeEventListener('mouseleave', () => setShowControls(true));
      }
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isPlaying]);

  // Update time và duration
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleDurationChange = () => setDuration(video.duration);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      if (onVideoEnd) onVideoEnd();
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', handleDurationChange);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
    };
  }, [onVideoEnd]);

  // Reset trạng thái resume khi đổi tập
  useEffect(() => {
    hasResumed.current = false;
  }, [src]);

  // Load video stream
  useEffect(() => {
    if (!videoRef.current || !src) return;
    const video = videoRef.current;
    const proxiedUrl = `/proxy-stream?url=${encodeURIComponent(src)}`;

    if (hlsRef.current) hlsRef.current.destroy();

    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(proxiedUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
        setIsPlaying(true);
      });
      hlsRef.current = hls;
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = proxiedUrl;
    }

    return () => {
      if (hlsRef.current) hlsRef.current.destroy();
    };
  }, [src]);

  // Xử lý Resume Time
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !movieInfo?.currentTime || hasResumed.current) return;

    const handleCanPlay = () => {
      if (!hasResumed.current && movieInfo.currentTime > 0) {
        video.currentTime = movieInfo.currentTime;
        hasResumed.current = true;
      }
    };

    video.addEventListener("loadedmetadata", handleCanPlay);
    return () => video.removeEventListener("loadedmetadata", handleCanPlay);
  }, [src, movieInfo?.currentTime]);

  // Lưu lịch sử mỗi 5s
  useEffect(() => {
    if (!movieInfo) return;
    const interval = setInterval(() => {
      const video = videoRef.current;
      if (video && !video.paused) {
        saveHistoryItem({
          ...movieInfo,
          currentTime: video.currentTime,
          updatedAt: Date.now()
        });
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [movieInfo]);

  // Toggle mute
  const toggleMute = () => {
    if (videoRef.current) {
      if (isMuted) {
        videoRef.current.volume = prevVolume;
        setVolume(prevVolume);
      } else {
        setPrevVolume(volume);
        videoRef.current.volume = 0;
        setVolume(0);
      }
      setIsMuted(!isMuted);
    }
  };

  // Format time
  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <Card sx={{ mt: 2, bgcolor: "#1a1a1a", color: "white" }}>
      {title && (
        <Box sx={{ p: 2 }}>
          <Typography variant="h6">{title}</Typography>
        </Box>
      )}
      <Box 
        ref={containerRef}
        sx={{ 
          width: "100%", 
          maxWidth: 960, 
          margin: "0 auto", 
          bgcolor: "black", 
          aspectRatio: "16/9",
          position: "relative",
          overflow: "hidden",
          cursor: showControls ? "auto" : "none"
        }}
        {...bindGestures()}
      >
        <video
          ref={videoRef}
          controls={false}
          autoPlay
          style={{ 
            width: "100%", 
            height: "100%", 
            objectFit: "contain",
            filter: `brightness(${brightness}%)`
          }}
        />

        {/* Play/Pause Center Indicator */}
        <AnimatePresence>
          {!isPlaying && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                background: "rgba(0,0,0,0.6)",
                borderRadius: "50%",
                width: 80,
                height: 80,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                pointerEvents: "none"
              }}
            >
              <PlayArrow sx={{ fontSize: 48, color: "white" }} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Seek Indicator */}
        <AnimatePresence>
          {showSeekIndicator && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                background: "rgba(0,0,0,0.7)",
                borderRadius: "50%",
                width: 100,
                height: 100,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: 24,
                fontWeight: "bold"
              }}
            >
              {seekDirection === 'forward' ? '+10' : '-10'}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Waveform Animation */}
        <AnimatePresence>
          {waveformBars.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: "absolute",
                bottom: "20%",
                left: 0,
                right: 0,
                display: "flex",
                justifyContent: "center",
                alignItems: "flex-end",
                gap: 4,
                height: 60,
                pointerEvents: "none"
              }}
            >
              {waveformBars.map((bar) => (
                <motion.div
                  key={bar.id}
                  initial={{ height: 0 }}
                  animate={{ 
                    height: bar.height,
                    transition: { delay: bar.delay, duration: 0.3 }
                  }}
                  exit={{ height: 0 }}
                  style={{
                    width: 4,
                    backgroundColor: "#ff4081",
                    borderRadius: 2
                  }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Brightness Indicator */}
        <AnimatePresence>
          {showBrightnessIndicator && (
            <motion.div
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -100, opacity: 0 }}
              style={{
                position: "absolute",
                left: 20,
                top: "50%",
                transform: "translateY(-50%)",
                background: "rgba(0,0,0,0.7)",
                borderRadius: 8,
                padding: "12px 8px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8
              }}
            >
              {brightness > 50 ? (
                <BrightnessHigh sx={{ color: "white" }} />
              ) : (
                <BrightnessLow sx={{ color: "white" }} />
              )}
              <Typography variant="caption" sx={{ color: "white" }}>
                {Math.round(brightness)}%
              </Typography>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Volume Indicator */}
        <AnimatePresence>
          {showVolumeIndicator && (
            <motion.div
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 100, opacity: 0 }}
              style={{
                position: "absolute",
                right: 20,
                top: "50%",
                transform: "translateY(-50%)",
                background: "rgba(0,0,0,0.7)",
                borderRadius: 8,
                padding: "12px 8px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8
              }}
            >
              {volume === 0 ? (
                <VolumeOff sx={{ color: "white" }} />
              ) : volume < 0.5 ? (
                <VolumeDown sx={{ color: "white" }} />
              ) : (
                <VolumeUp sx={{ color: "white" }} />
              )}
              <Typography variant="caption" sx={{ color: "white" }}>
                {Math.round(volume * 100)}%
              </Typography>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Custom Controls */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              transition={{ type: "spring", damping: 20 }}
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                background: "linear-gradient(transparent, rgba(0,0,0,0.9))",
                padding: "20px 16px 16px",
              }}
            >
              {/* Progress Bar */}
              <Box sx={{ width: "100%", mb: 2 }}>
                <Slider
                  size="small"
                  value={currentTime}
                  max={duration}
                  onChange={(_, value) => {
                    if (videoRef.current) {
                      videoRef.current.currentTime = value;
                    }
                  }}
                  sx={{
                    color: "#ff4081",
                    height: 4,
                    "& .MuiSlider-thumb": {
                      width: 12,
                      height: 12,
                      transition: "0.2s",
                      "&:hover": {
                        width: 16,
                        height: 16,
                      }
                    },
                    "& .MuiSlider-track": {
                      border: "none",
                    },
                    "& .MuiSlider-rail": {
                      opacity: 0.3,
                      backgroundColor: "#bfbfbf",
                    },
                  }}
                />
                <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.5 }}>
                  <Typography variant="caption" sx={{ color: "white" }}>
                    {formatTime(currentTime)}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "white" }}>
                    {formatTime(duration)}
                  </Typography>
                </Box>
              </Box>

              {/* Control Buttons */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <IconButton onClick={togglePlay} sx={{ color: "white" }}>
                  {isPlaying ? <Pause /> : <PlayArrow />}
                </IconButton>

                <IconButton onClick={() => handleSeek(-10)} sx={{ color: "white" }}>
                  <Replay10 />
                </IconButton>

                <IconButton onClick={() => handleSeek(10)} sx={{ color: "white" }}>
                  <Forward10 />
                </IconButton>

                {onPrevEpisode && (
                  <IconButton onClick={onPrevEpisode} sx={{ color: "white" }}>
                    <SkipPrevious />
                  </IconButton>
                )}

                {onNextEpisode && (
                  <IconButton onClick={onNextEpisode} sx={{ color: "white" }}>
                    <SkipNext />
                  </IconButton>
                )}

                <IconButton onClick={toggleMute} sx={{ color: "white" }}>
                  {isMuted ? <VolumeOff /> : volume < 0.5 ? <VolumeDown /> : <VolumeUp />}
                </IconButton>

                <Slider
                  size="small"
                  value={volume}
                  onChange={(_, value) => {
                    setVolume(value);
                    if (videoRef.current) {
                      videoRef.current.volume = value;
                    }
                    setIsMuted(value === 0);
                  }}
                  min={0}
                  max={1}
                  step={0.01}
                  sx={{ 
                    width: 80,
                    color: "white",
                    "& .MuiSlider-track": { bgcolor: "white" },
                    "& .MuiSlider-thumb": { 
                      width: 12, 
                      height: 12,
                      bgcolor: "white" 
                    }
                  }}
                />

                <Box sx={{ flex: 1 }} />

                {/* Playback Speed */}
                <IconButton 
                  onClick={() => setShowSettings(!showSettings)}
                  sx={{ color: "white" }}
                >
                  <Settings />
                </IconButton>

                <IconButton onClick={toggleFullscreen} sx={{ color: "white" }}>
                  {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
                </IconButton>
              </Box>

              {/* Settings Menu */}
              <AnimatePresence>
                {showSettings && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    style={{
                      position: "absolute",
                      bottom: 80,
                      right: 16,
                      background: "rgba(0,0,0,0.9)",
                      borderRadius: 8,
                      padding: 8,
                      minWidth: 150
                    }}
                  >
                    <Typography variant="caption" sx={{ color: "gray", px: 2, py: 1 }}>
                      Tốc độ phát
                    </Typography>
                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
                      <Box
                        key={speed}
                        onClick={() => changePlaybackSpeed(speed)}
                        sx={{
                          px: 2,
                          py: 1,
                          cursor: "pointer",
                          bgcolor: playbackSpeed === speed ? "#ff4081" : "transparent",
                          "&:hover": {
                            bgcolor: playbackSpeed === speed ? "#ff4081" : "#333"
                          }
                        }}
                      >
                        <Typography variant="body2" sx={{ color: "white" }}>
                          {speed === 1 ? "Bình thường" : `${speed}x`}
                        </Typography>
                      </Box>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Episode Info */}
        <AnimatePresence>
          {showControls && currentEpisode && (
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}
              style={{
                position: "absolute",
                top: 16,
                left: 16,
                background: "rgba(0,0,0,0.6)",
                padding: "4px 12px",
                borderRadius: 20,
                backdropFilter: "blur(5px)"
              }}
            >
              <Typography variant="body2" sx={{ color: "white" }}>
                Đang phát: {currentEpisode}
              </Typography>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Zone Indicators */}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "20%",
            height: "100%",
            pointerEvents: "none",
            borderRight: showControls ? "2px dashed rgba(255,255,255,0.3)" : "none",
            "&::before": {
              content: '"Độ sáng"',
              position: "absolute",
              top: 10,
              left: 10,
              color: "rgba(255,255,255,0.5)",
              fontSize: 12,
              opacity: showControls ? 1 : 0,
              transition: "opacity 0.3s"
            }
          }}
        />

        <Box
          sx={{
            position: "absolute",
            top: 0,
            right: 0,
            width: "20%",
            height: "100%",
            pointerEvents: "none",
            borderLeft: showControls ? "2px dashed rgba(255,255,255,0.3)" : "none",
            "&::before": {
              content: '"Âm lượng"',
              position: "absolute",
              top: 10,
              right: 10,
              color: "rgba(255,255,255,0.5)",
              fontSize: 12,
              opacity: showControls ? 1 : 0,
              transition: "opacity 0.3s"
            }
          }}
        />
      </Box>
    </Card>
  );
};

export default VideoPlayer;
