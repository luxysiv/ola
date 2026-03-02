// src/components/VideoPlayer.js
import React, { useRef, useEffect, useState, useCallback } from "react";
import Hls from "hls.js";
import { Card, Box, Typography, Slider, IconButton } from "@mui/material";
import { 
  VolumeUp, VolumeOff, VolumeDown, 
  Brightness7, Brightness4,
  PlayArrow, Pause, Fullscreen, FullscreenExit,
  SkipNext, SkipPrevious, Settings, Forward10, Replay10 
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import { useGesture } from "@use-gesture/react";
import { saveHistoryItem } from "../utils/history";

const VideoPlayer = ({ src, title, movieInfo, onVideoEnd, episodeList = [], currentEpisode, onPrevEpisode, onNextEpisode }) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const hlsRef = useRef(null);
  const hasResumed = useRef(false);
  
  // UI States
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [prevVolume, setPrevVolume] = useState(1);
  const [brightness, setBrightness] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [showSeekIndicator, setShowSeekIndicator] = useState(false);
  const [seekDirection, setSeekDirection] = useState(null);
  const [seekAmount, setSeekAmount] = useState(0);
  const [showVolumeIndicator, setShowVolumeIndicator] = useState(false);
  const [showBrightnessIndicator, setShowBrightnessIndicator] = useState(false);
  const [wavePoints, setWavePoints] = useState([]);
  const [isDraggingVolume, setIsDraggingVolume] = useState(false);
  const [isDraggingBrightness, setIsDraggingBrightness] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const controlsTimeout = useRef(null);

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

  // Auto hide controls
  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);
      setShowSettings(false);
      if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
      controlsTimeout.current = setTimeout(() => {
        if (isPlaying && !isDraggingVolume && !isDraggingBrightness) {
          setShowControls(false);
        }
      }, 3000);
    };

    const container = containerRef.current;
    container?.addEventListener('mousemove', handleMouseMove);
    container?.addEventListener('mouseleave', () => setShowControls(true));

    return () => {
      container?.removeEventListener('mousemove', handleMouseMove);
      container?.removeEventListener('mouseleave', () => setShowControls(true));
      if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    };
  }, [isPlaying, isDraggingVolume, isDraggingBrightness]);

  // Video event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleDurationChange = () => setDuration(video.duration);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      onVideoEnd?.();
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

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Double tap handler
  const handleDoubleTap = useCallback((direction) => {
    if (!videoRef.current) return;
    
    const seekSeconds = 10;
    const newTime = direction === 'backward'
      ? Math.max(0, videoRef.current.currentTime - seekSeconds)
      : Math.min(duration, videoRef.current.currentTime + seekSeconds);
    
    videoRef.current.currentTime = newTime;
    setSeekDirection(direction);
    setSeekAmount(seekSeconds);
    setShowSeekIndicator(true);
    
    // Create wave effect
    const points = Array.from({ length: 30 }, (_, i) => ({
      x: 20 + Math.random() * 60,
      y: 20 + Math.random() * 60,
      delay: i * 0.03
    }));
    setWavePoints(points);
    
    setTimeout(() => setShowSeekIndicator(false), 800);
  }, [duration]);

  // Gesture handlers
  const bind = useGesture({
    onDoubleTap: ({ event }) => {
      event.preventDefault();
      const rect = event.target.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const isLeftSide = x < rect.width / 2;
      handleDoubleTap(isLeftSide ? 'backward' : 'forward');
    },
    onDrag: ({ movement: [, dy], first, last, active, event }) => {
      event.preventDefault();
      
      const rect = event.target.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const isLeftSide = x < rect.width * 0.2;
      const isRightSide = x > rect.width * 0.8;
      
      if (isLeftSide) {
        if (first) setIsDraggingBrightness(true);
        if (active) {
          const newBrightness = Math.max(0.2, Math.min(1.5, brightness - dy / 200));
          setBrightness(newBrightness);
          setShowBrightnessIndicator(true);
        }
        if (last) {
          setIsDraggingBrightness(false);
          setTimeout(() => setShowBrightnessIndicator(false), 1000);
        }
      } else if (isRightSide) {
        if (first) setIsDraggingVolume(true);
        if (active) {
          const newVolume = Math.max(0, Math.min(1, volume - dy / 200));
          setVolume(newVolume);
          if (videoRef.current) videoRef.current.volume = newVolume;
          setShowVolumeIndicator(true);
        }
        if (last) {
          setIsDraggingVolume(false);
          setTimeout(() => setShowVolumeIndicator(false), 1000);
        }
      }
    }
  }, {
    drag: {
      filterTaps: true,
      axis: 'y',
      pointer: { touch: true }
    }
  });

  // Format time
  const formatTime = (seconds) => {
    if (!seconds) return '0:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return h > 0 
      ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
      : `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Toggle play/pause
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  // Handle seek
  const handleSeek = (_, value) => {
    if (videoRef.current) {
      videoRef.current.currentTime = value;
    }
  };

  // Handle volume change
  const handleVolumeChange = (_, value) => {
    setVolume(value);
    if (videoRef.current) {
      videoRef.current.volume = value;
    }
    setIsMuted(value === 0);
  };

  // Toggle mute
  const toggleMute = () => {
    if (volume > 0) {
      setPrevVolume(volume);
      setVolume(0);
      if (videoRef.current) videoRef.current.volume = 0;
    } else {
      setVolume(prevVolume);
      if (videoRef.current) videoRef.current.volume = prevVolume;
    }
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  // Change playback speed
  const changePlaybackSpeed = (speed) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
      setPlaybackSpeed(speed);
      setShowSettings(false);
    }
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
          cursor: showControls ? 'auto' : 'none'
        }}
        {...bind()}
      >
        {/* Video element with brightness filter */}
        <video
          ref={videoRef}
          autoPlay
          style={{ 
            width: "100%", 
            height: "100%", 
            objectFit: "contain",
            filter: `brightness(${brightness})`
          }}
        />

        {/* Wave effect overlay */}
        <AnimatePresence>
          {showSeekIndicator && wavePoints.length > 0 && (
            <motion.svg
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 20
              }}
            >
              {wavePoints.map((point, i) => (
                <motion.circle
                  key={i}
                  cx={`${point.x}%`}
                  cy={`${point.y}%`}
                  r="4"
                  fill="#ff4081"
                  initial={{ scale: 0, opacity: 1 }}
                  animate={{ 
                    scale: [0, 2, 0],
                    opacity: [1, 0.5, 0],
                    x: [0, (Math.random() - 0.5) * 50, 0],
                    y: [0, (Math.random() - 0.5) * 50, 0]
                  }}
                  transition={{ 
                    duration: 0.8,
                    delay: point.delay,
                    ease: "easeOut"
                  }}
                />
              ))}
            </motion.svg>
          )}
        </AnimatePresence>

        {/* Seek indicator */}
        <AnimatePresence>
          {showSeekIndicator && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                background: 'rgba(0,0,0,0.8)',
                color: 'white',
                padding: '15px 30px',
                borderRadius: '50px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '28px',
                fontWeight: 'bold',
                border: '2px solid #ff4081',
                boxShadow: '0 0 20px rgba(255,64,129,0.3)',
                zIndex: 25
              }}
            >
              {seekDirection === 'backward' ? '⏪' : '⏩'} {seekAmount}s
            </motion.div>
          )}
        </AnimatePresence>

        {/* Volume indicator */}
        <AnimatePresence>
          {(showVolumeIndicator || isDraggingVolume) && (
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              style={{
                position: 'absolute',
                top: '50%',
                right: '20px',
                transform: 'translateY(-50%)',
                background: 'rgba(0,0,0,0.8)',
                color: 'white',
                padding: '15px',
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px',
                border: '1px solid #ff4081',
                zIndex: 30
              }}
            >
              {volume === 0 ? <VolumeOff /> : volume < 0.5 ? <VolumeDown /> : <VolumeUp />}
              <Typography variant="caption" sx={{ fontWeight: 'bold' }}>{Math.round(volume * 100)}%</Typography>
              <Box sx={{ width: 60, height: 4, bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 2 }}>
                <Box sx={{ width: `${volume * 100}%`, height: '100%', bgcolor: '#ff4081', borderRadius: 2 }} />
              </Box>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Brightness indicator */}
        <AnimatePresence>
          {(showBrightnessIndicator || isDraggingBrightness) && (
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              style={{
                position: 'absolute',
                top: '50%',
                left: '20px',
                transform: 'translateY(-50%)',
                background: 'rgba(0,0,0,0.8)',
                color: 'white',
                padding: '15px',
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px',
                border: '1px solid #ff4081',
                zIndex: 30
              }}
            >
              {brightness > 1 ? <Brightness7 /> : <Brightness4 />}
              <Typography variant="caption" sx={{ fontWeight: 'bold' }}>{Math.round(brightness * 100)}%</Typography>
              <Box sx={{ width: 60, height: 4, bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 2 }}>
                <Box sx={{ width: `${((brightness - 0.2) / 1.3) * 100}%`, height: '100%', bgcolor: '#ff4081', borderRadius: 2 }} />
              </Box>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Current episode indicator */}
        <AnimatePresence>
          {showControls && currentEpisode && (
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}
              style={{
                position: 'absolute',
                top: '20px',
                left: '20px',
                background: 'rgba(0,0,0,0.7)',
                color: 'white',
                padding: '6px 12px',
                borderRadius: '20px',
                fontSize: '14px',
                border: '1px solid rgba(255,255,255,0.2)',
                backdropFilter: 'blur(5px)',
                zIndex: 15
              }}
            >
              {currentEpisode}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Zone indicators */}
        <AnimatePresence>
          {showControls && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.1 }}
                exit={{ opacity: 0 }}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '20%',
                  height: '100%',
                  background: 'linear-gradient(90deg, rgba(255,64,129,0.2) 0%, transparent 100%)',
                  pointerEvents: 'none',
                  borderRight: '1px dashed rgba(255,64,129,0.3)',
                  zIndex: 5
                }}
              />
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.1 }}
                exit={{ opacity: 0 }}
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: '20%',
                  height: '100%',
                  background: 'linear-gradient(-90deg, rgba(255,64,129,0.2) 0%, transparent 100%)',
                  pointerEvents: 'none',
                  borderLeft: '1px dashed rgba(255,64,129,0.3)',
                  zIndex: 5
                }}
              />
            </>
          )}
        </AnimatePresence>

        {/* Zone labels */}
        <AnimatePresence>
          {showControls && (
            <>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 0.6, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '10px',
                  transform: 'translateY(-50%) rotate(-90deg)',
                  color: 'rgba(255,255,255,0.6)',
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  whiteSpace: 'nowrap',
                  zIndex: 6,
                  textShadow: '0 0 5px rgba(0,0,0,0.5)'
                }}
              >
                ĐỘ SÁNG
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 0.6, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                style={{
                  position: 'absolute',
                  top: '50%',
                  right: '10px',
                  transform: 'translateY(-50%) rotate(90deg)',
                  color: 'rgba(255,255,255,0.6)',
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  whiteSpace: 'nowrap',
                  zIndex: 6,
                  textShadow: '0 0 5px rgba(0,0,0,0.5)'
                }}
              >
                ÂM LƯỢNG
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Controls overlay */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              transition={{ type: "spring", damping: 25 }}
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'linear-gradient(transparent, rgba(0,0,0,0.9))',
                padding: '15px 20px 12px',
                color: 'white',
                zIndex: 35
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Progress bar */}
              <Box sx={{ mb: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="caption" sx={{ fontSize: '0.7rem', minWidth: 35 }}>
                    {formatTime(currentTime)}
                  </Typography>
                  <Slider
                    value={currentTime}
                    max={duration || 100}
                    onChange={handleSeek}
                    sx={{
                      flex: 1,
                      color: '#ff4081',
                      height: 3,
                      padding: '3px 0',
                      '& .MuiSlider-thumb': {
                        width: 10,
                        height: 10,
                        '&:hover, &.Mui-focusVisible': {
                          boxShadow: '0 0 0 8px rgba(255,64,129,0.16)'
                        }
                      },
                      '& .MuiSlider-rail': {
                        bgcolor: 'rgba(255,255,255,0.3)',
                        height: 3
                      },
                      '& .MuiSlider-track': {
                        height: 3,
                        border: 'none'
                      }
                    }}
                  />
                  <Typography variant="caption" sx={{ fontSize: '0.7rem', minWidth: 35 }}>
                    {formatTime(duration)}
                  </Typography>
                </Box>
              </Box>

              {/* Control buttons */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 } }}>
                <IconButton onClick={togglePlay} sx={{ color: 'white', p: { xs: 0.5, sm: 1 } }}>
                  {isPlaying ? <Pause fontSize="small" /> : <PlayArrow fontSize="small" />}
                </IconButton>
                
                <IconButton onClick={() => handleDoubleTap('backward')} sx={{ color: 'white', p: { xs: 0.5, sm: 1 } }}>
                  <Replay10 fontSize="small" />
                </IconButton>
                
                <IconButton onClick={() => handleDoubleTap('forward')} sx={{ color: 'white', p: { xs: 0.5, sm: 1 } }}>
                  <Forward10 fontSize="small" />
                </IconButton>

                {onPrevEpisode && (
                  <IconButton onClick={onPrevEpisode} sx={{ color: 'white', p: { xs: 0.5, sm: 1 } }}>
                    <SkipPrevious fontSize="small" />
                  </IconButton>
                )}
                
                {onNextEpisode && (
                  <IconButton onClick={onNextEpisode} sx={{ color: 'white', p: { xs: 0.5, sm: 1 } }}>
                    <SkipNext fontSize="small" />
                  </IconButton>
                )}

                {/* Volume control */}
                <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 0.5, ml: 1 }}>
                  <IconButton onClick={toggleMute} sx={{ color: 'white', p: 0.5 }}>
                    {volume === 0 ? <VolumeOff fontSize="small" /> : volume < 0.5 ? <VolumeDown fontSize="small" /> : <VolumeUp fontSize="small" />}
                  </IconButton>
                  <Box sx={{ width: 60 }}>
                    <Slider
                      value={volume}
                      min={0}
                      max={1}
                      step={0.01}
                      onChange={handleVolumeChange}
                      sx={{
                        color: '#ff4081',
                        height: 3,
                        '& .MuiSlider-thumb': { width: 8, height: 8 },
                        '& .MuiSlider-rail': { bgcolor: 'rgba(255,255,255,0.3)', height: 3 },
                        '& .MuiSlider-track': { height: 3 }
                      }}
                    />
                  </Box>
                </Box>

                <Box sx={{ flex: 1 }} />

                {/* Settings */}
                <Box sx={{ position: 'relative' }}>
                  <IconButton 
                    onClick={() => setShowSettings(!showSettings)} 
                    sx={{ color: 'white', p: { xs: 0.5, sm: 1 } }}
                  >
                    <Settings fontSize="small" />
                  </IconButton>
                  
                  <AnimatePresence>
                    {showSettings && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        style={{
                          position: 'absolute',
                          bottom: 40,
                          right: 0,
                          background: 'rgba(0,0,0,0.95)',
                          borderRadius: '8px',
                          padding: '8px',
                          minWidth: '140px',
                          border: '1px solid rgba(255,64,129,0.3)',
                          zIndex: 40
                        }}
                      >
                        <Typography variant="caption" sx={{ color: 'gray', px: 2, py: 1, display: 'block' }}>
                          Tốc độ phát
                        </Typography>
                        {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
                          <Box
                            key={speed}
                            onClick={() => changePlaybackSpeed(speed)}
                            sx={{
                              px: 2,
                              py: 0.8,
                              cursor: 'pointer',
                              bgcolor: playbackSpeed === speed ? '#ff4081' : 'transparent',
                              borderRadius: '4px',
                              '&:hover': {
                                bgcolor: playbackSpeed === speed ? '#ff4081' : '#333'
                              }
                            }}
                          >
                            <Typography variant="body2" sx={{ color: 'white', fontSize: '0.8rem' }}>
                              {speed === 1 ? 'Bình thường' : `${speed}x`}
                            </Typography>
                          </Box>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Box>

                {/* Fullscreen */}
                <IconButton onClick={toggleFullscreen} sx={{ color: 'white', p: { xs: 0.5, sm: 1 } }}>
                  {isFullscreen ? <FullscreenExit fontSize="small" /> : <Fullscreen fontSize="small" />}
                </IconButton>
              </Box>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Play/Pause center indicator (when paused) */}
        <AnimatePresence>
          {!isPlaying && !showControls && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                background: 'rgba(0,0,0,0.5)',
                borderRadius: '50%',
                width: 60,
                height: 60,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 10
              }}
              onClick={togglePlay}
            >
              <PlayArrow sx={{ fontSize: 35, color: 'white' }} />
            </motion.div>
          )}
        </AnimatePresence>
      </Box>
    </Card>
  );
};

export default VideoPlayer;
