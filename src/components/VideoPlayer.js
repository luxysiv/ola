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
  const [isDragging, setIsDragging] = useState(false);

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
    setShowSettings(false);
  };

  // Xử lý kéo để điều chỉnh brightness/volume
  const bindGestures = useGesture(
    {
      onDrag: ({ movement: [mx, my], first, last, event, intentional }) => {
        event.preventDefault();
        const { clientX, clientY } = event;
        const container = containerRef.current;
        if (!container) return;

        const rect = container.getBoundingClientRect();
        const relativeX = clientX - rect.left;
        const width = rect.width;
        const height = rect.height;

        // Phân vùng: 15% trái cho brightness, 15% phải cho volume
        const leftZone = width * 0.15;
        const rightZone = width * 0.85;

        if (relativeX < leftZone) {
          // Điều chỉnh brightness
          if (first) {
            setIsDragging(true);
            setShowBrightnessIndicator(true);
          }
          
          // Tính toán brightness dựa trên vị trí kéo
          const dragPercent = -my / height;
          const brightnessChange = dragPercent * 100;
          const newBrightness = Math.max(20, Math.min(150, brightness + brightnessChange));
          setBrightness(newBrightness);
          
          if (last) {
            setIsDragging(false);
            setTimeout(() => setShowBrightnessIndicator(false), 1000);
          }
        } else if (relativeX > rightZone) {
          // Điều chỉnh volume
          if (first) {
            setIsDragging(true);
            setShowVolumeIndicator(true);
          }
          
          // Tính toán volume dựa trên vị trí kéo
          const dragPercent = -my / height;
          let newVolume = Math.max(0, Math.min(1, volume + dragPercent));
          setVolume(newVolume);
          if (videoRef.current) {
            videoRef.current.volume = newVolume;
          }
          
          if (last) {
            setIsDragging(false);
            setTimeout(() => setShowVolumeIndicator(false), 1000);
          }
        }
      },
    },
    {
      drag: {
        filterTaps: true,
        axis: 'y',
        pointer: { touch: true },
        threshold: 5,
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
      // Không xử lý double tap nếu đang kéo
      if (isDragging) return;

      const currentTime = new Date().getTime();
      const tapLength = currentTime - lastTap;
      
      if (tapLength < 300 && tapLength > 0) {
        // Double tap detected
        e.preventDefault();
        const touch = e.changedTouches[0];
        const rect = video.getBoundingClientRect();
        const touchX = touch.clientX - rect.left;
        
        // Chỉ xử lý double tap nếu không ở vùng điều khiển brightness/volume
        const width = rect.width;
        const leftZone = width * 0.15;
        const rightZone = width * 0.85;
        
        if (touchX > leftZone && touchX < rightZone) {
          if (touchX < rect.width / 2) {
            handleDoubleTap('backward');
          } else {
            handleDoubleTap('forward');
          }
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
  }, [isDragging]);

  // Auto hide controls
  useEffect(() => {
    const handleMouseMove = () => {
      if (!isDragging) {
        setShowControls(true);
        
        if (controlsTimeoutRef.current) {
          clearTimeout(controlsTimeoutRef.current);
        }
        
        controlsTimeoutRef.current = setTimeout(() => {
          if (isPlaying && !isDragging) {
            setShowControls(false);
          }
        }, 3000);
      }
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
  }, [isPlaying, isDragging]);

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
          cursor: showControls ? "auto" : "none",
          userSelect: "none",
          WebkitUserSelect: "none",
        }}
        {...bindGestures()}
        onClick={togglePlay}
      >
        <video
          ref={videoRef}
          controls={false}
          autoPlay
          style={{ 
            width: "100%", 
            height: "100%", 
            objectFit: "contain",
            filter: `brightness(${brightness}%)`,
            pointerEvents: "none",
          }}
        />

        {/* Play/Pause Center Indicator */}
        <AnimatePresence>
          {!isPlaying && showControls && (
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
                pointerEvents: "none",
                zIndex: 10
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
                fontWeight: "bold",
                zIndex: 20
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
                pointerEvents: "none",
                zIndex: 15
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
                gap: 8,
                zIndex: 25
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
              <Box 
                sx={{ 
                  width: 4, 
                  height: 60, 
                  background: "rgba(255,255,255,0.2)",
                  borderRadius: 2,
                  position: "relative",
                  mt: 1
                }}
              >
                <Box 
                  sx={{ 
                    position: "absolute",
                    bottom: 0,
                    width: "100%",
                    height: `${(brightness - 20) / 130 * 100}%`,
                    background: "white",
                    borderRadius: 2
                  }} 
                />
              </Box>
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
                gap: 8,
                zIndex: 25
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
              <Box 
                sx={{ 
                  width: 4, 
                  height: 60, 
                  background: "rgba(255,255,255,0.2)",
                  borderRadius: 2,
                  position: "relative",
                  mt: 1
                }}
              >
                <Box 
                  sx={{ 
                    position: "absolute",
                    bottom: 0,
                    width: "100%",
                    height: `${volume * 100}%`,
                    background: "white",
                    borderRadius: 2
                  }} 
                />
              </Box>
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
                padding: "12px 16px 8px",
                zIndex: 30
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Progress Bar - Mỏng hơn */}
              <Box sx={{ width: "100%", mb: 1.5, px: 0.5 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography variant="caption" sx={{ color: "white", fontSize: "0.7rem" }}>
                    {formatTime(currentTime)}
                  </Typography>
                  <Box sx={{ flex: 1, position: "relative" }}>
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
                        height: 3,
                        padding: "4px 0",
                        "& .MuiSlider-thumb": {
                          width: 10,
                          height: 10,
                          transition: "0.2s",
                          "&:hover": {
                            width: 14,
                            height: 14,
                          },
                          "&.Mui-active": {
                            width: 14,
                            height: 14,
                          }
                        },
                        "& .MuiSlider-track": {
                          border: "none",
                          height: 3,
                        },
                        "& .MuiSlider-rail": {
                          opacity: 0.3,
                          backgroundColor: "#bfbfbf",
                          height: 3,
                        },
                      }}
                    />
                  </Box>
                  <Typography variant="caption" sx={{ color: "white", fontSize: "0.7rem" }}>
                    {formatTime(duration)}
                  </Typography>
                </Box>
              </Box>

              {/* Control Buttons */}
              <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.5, sm: 1 } }}>
                <IconButton onClick={togglePlay} sx={{ color: "white", p: { xs: 0.5, sm: 1 } }}>
                  {isPlaying ? <Pause fontSize="small" /> : <PlayArrow fontSize="small" />}
                </IconButton>

                <IconButton onClick={() => handleSeek(-10)} sx={{ color: "white", p: { xs: 0.5, sm: 1 } }}>
                  <Replay10 fontSize="small" />
                </IconButton>

                <IconButton onClick={() => handleSeek(10)} sx={{ color: "white", p: { xs: 0.5, sm: 1 } }}>
                  <Forward10 fontSize="small" />
                </IconButton>

                {onPrevEpisode && (
                  <IconButton onClick={onPrevEpisode} sx={{ color: "white", p: { xs: 0.5, sm: 1 } }}>
                    <SkipPrevious fontSize="small" />
                  </IconButton>
                )}

                {onNextEpisode && (
                  <IconButton onClick={onNextEpisode} sx={{ color: "white", p: { xs: 0.5, sm: 1 } }}>
                    <SkipNext fontSize="small" />
                  </IconButton>
                )}

                <IconButton onClick={toggleMute} sx={{ color: "white", p: { xs: 0.5, sm: 1 } }}>
                  {isMuted ? <VolumeOff fontSize="small" /> : volume < 0.5 ? <VolumeDown fontSize="small" /> : <VolumeUp fontSize="small" />}
                </IconButton>

                <Box sx={{ display: { xs: "none", sm: "block" }, width: 60 }}>
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
                      color: "white",
                      height: 3,
                      "& .MuiSlider-track": { bgcolor: "white", height: 3 },
                      "& .MuiSlider-rail": { height: 3 },
                      "& .MuiSlider-thumb": { 
                        width: 10, 
                        height: 10,
                        bgcolor: "white" 
                      }
                    }}
                  />
                </Box>

                <Box sx={{ flex: 1 }} />

                <IconButton 
                  onClick={() => setShowSettings(!showSettings)}
                  sx={{ color: "white", p: { xs: 0.5, sm: 1 } }}
                >
                  <Settings fontSize="small" />
                </IconButton>

                <IconButton onClick={toggleFullscreen} sx={{ color: "white", p: { xs: 0.5, sm: 1 } }}>
                  {isFullscreen ? <FullscreenExit fontSize="small" /> : <Fullscreen fontSize="small" />}
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
                      bottom: 70,
                      right: 16,
                      background: "rgba(0,0,0,0.95)",
                      borderRadius: 8,
                      padding: 8,
                      minWidth: 150,
                      border: "1px solid rgba(255,255,255,0.1)"
                    }}
                  >
                    <Typography variant="caption" sx={{ color: "gray", px: 2, py: 1, display: "block" }}>
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
                          borderRadius: 1,
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
                backdropFilter: "blur(5px)",
                zIndex: 30,
                pointerEvents: "none"
              }}
            >
              <Typography variant="body2" sx={{ color: "white", fontSize: { xs: "0.75rem", sm: "0.875rem" } }}>
                {currentEpisode}
              </Typography>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Zone Indicators - Mờ hơn và chỉ hiện khi có controls */}
        <AnimatePresence>
          {showControls && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.15 }}
                exit={{ opacity: 0 }}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "15%",
                  height: "100%",
                  background: "linear-gradient(90deg, rgba(255,255,255,0.1) 0%, transparent 100%)",
                  pointerEvents: "none",
                  borderRight: "1px dashed rgba(255,255,255,0.2)",
                  zIndex: 5
                }}
              />
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.15 }}
                exit={{ opacity: 0 }}
                style={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  width: "15%",
                  height: "100%",
                  background: "linear-gradient(-90deg, rgba(255,255,255,0.1) 0%, transparent 100%)",
                  pointerEvents: "none",
                  borderLeft: "1px dashed rgba(255,255,255,0.2)",
                  zIndex: 5
                }}
              />
            </>
          )}
        </AnimatePresence>

        {/* Zone Labels */}
        <AnimatePresence>
          {showControls && (
            <>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 0.5, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                style={{
                  position: "absolute",
                  top: "50%",
                  left: 10,
                  transform: "translateY(-50%) rotate(-90deg)",
                  color: "white",
                  fontSize: "0.7rem",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  whiteSpace: "nowrap",
                  zIndex: 6
                }}
              >
                ĐỘ SÁNG
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 0.5, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                style={{
                  position: "absolute",
                  top: "50%",
                  right: 10,
                  transform: "translateY(-50%) rotate(90deg)",
                  color: "white",
                  fontSize: "0.7rem",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  whiteSpace: "nowrap",
                  zIndex: 6
                }}
              >
                ÂM LƯỢNG
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </Box>
    </Card>
  );
};

export default VideoPlayer;
