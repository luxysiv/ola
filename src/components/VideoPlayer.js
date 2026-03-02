// src/components/VideoPlayer.js
import React, { useRef, useEffect, useState, useCallback } from "react";
import Hls from "hls.js";
import { Card, Box, Typography, Slider, IconButton } from "@mui/material";
import { 
  VolumeUp, VolumeOff, VolumeDown, 
  Brightness7, Brightness4,
  PlayArrow, Pause, Fullscreen, 
  SkipNext, SkipPrevious, Settings 
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import { useGesture } from "@use-gesture/react";
import { saveHistoryItem } from "../utils/history";

const VideoPlayer = ({ src, title, movieInfo, onVideoEnd }) => {
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
      hls.on(Hls.Events.MANIFEST_PARSED, () => {});
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
      if (!hasResumed.current) {
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
      if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
      controlsTimeout.current = setTimeout(() => {
        if (isPlaying) setShowControls(false);
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
  }, [isPlaying]);

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

  // Gesture handlers
  const bind = useGesture({
    onDoubleTap: ({ event }) => {
      const rect = event.target.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const isLeftSide = x < rect.width / 2;
      
      if (videoRef.current) {
        const newTime = isLeftSide 
          ? Math.max(0, videoRef.current.currentTime - 10)
          : Math.min(duration, videoRef.current.currentTime + 10);
        
        videoRef.current.currentTime = newTime;
        setSeekDirection(isLeftSide ? 'backward' : 'forward');
        setSeekAmount(10);
        setShowSeekIndicator(true);
        
        // Create wave effect
        const points = Array.from({ length: 20 }, (_, i) => ({
          x: i * 5,
          y: 50 + Math.sin(i * 0.5 + Date.now() * 0.01) * 30
        }));
        setWavePoints(points);
        
        setTimeout(() => setShowSeekIndicator(false), 1000);
      }
    },
    onDrag: ({ movement: [, dy], first, last, active, event }) => {
      // Prevent default browser zoom
      event.preventDefault();
      
      const rect = event.target.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const isLeftSide = x < rect.width * 0.2;
      const isRightSide = x > rect.width * 0.8;
      
      if (isLeftSide) {
        if (first) setIsDraggingBrightness(true);
        if (active) {
          const newBrightness = Math.max(0, Math.min(1, brightness - dy / 200));
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
          videoRef.current.volume = newVolume;
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
    }
  });

  // Format time
  const formatTime = (seconds) => {
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
          {showSeekIndicator && (
            <motion.svg
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none'
              }}
            >
              {wavePoints.map((point, i) => (
                <motion.circle
                  key={i}
                  cx={point.x * (960 / 100)}
                  cy={point.y * (540 / 100)}
                  r="4"
                  fill="white"
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1, 0] }}
                  transition={{ duration: 1, delay: i * 0.05 }}
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
                background: 'rgba(0,0,0,0.7)',
                color: 'white',
                padding: '20px 40px',
                borderRadius: '50px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '32px',
                fontWeight: 'bold',
                border: '2px solid rgba(255,255,255,0.2)'
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
                background: 'rgba(0,0,0,0.7)',
                color: 'white',
                padding: '15px',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px',
                border: '1px solid rgba(255,255,255,0.1)'
              }}
            >
              {volume === 0 ? <VolumeOff /> : volume < 0.5 ? <VolumeDown /> : <VolumeUp />}
              <Typography variant="caption">{Math.round(volume * 100)}%</Typography>
              <Box sx={{ width: 60, height: 4, bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 2 }}>
                <Box sx={{ width: `${volume * 100}%`, height: '100%', bgcolor: '#ff0000', borderRadius: 2 }} />
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
                background: 'rgba(0,0,0,0.7)',
                color: 'white',
                padding: '15px',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px',
                border: '1px solid rgba(255,255,255,0.1)'
              }}
            >
              <Brightness7 />
              <Typography variant="caption">{Math.round(brightness * 100)}%</Typography>
              <Box sx={{ width: 60, height: 4, bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 2 }}>
                <Box sx={{ width: `${brightness * 100}%`, height: '100%', bgcolor: '#ff0000', borderRadius: 2 }} />
              </Box>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Controls overlay */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                padding: '20px',
                color: 'white'
              }}
            >
              {/* Progress bar */}
              <Box sx={{ mb: 2 }}>
                <Slider
                  value={currentTime}
                  max={duration}
                  onChange={handleSeek}
                  sx={{
                    color: '#ff0000',
                    '& .MuiSlider-thumb': {
                      width: 12,
                      height: 12,
                      '&:hover, &.Mui-focusVisible': {
                        boxShadow: '0 0 0 8px rgba(255,0,0,0.16)'
                      }
                    },
                    '& .MuiSlider-rail': {
                      bgcolor: 'rgba(255,255,255,0.3)'
                    }
                  }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                  <Typography variant="caption">{formatTime(currentTime)}</Typography>
                  <Typography variant="caption">{formatTime(duration)}</Typography>
                </Box>
              </Box>

              {/* Control buttons */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton onClick={togglePlay} sx={{ color: 'white' }}>
                  {isPlaying ? <Pause /> : <PlayArrow />}
                </IconButton>
                
                <IconButton sx={{ color: 'white' }}>
                  <SkipPrevious />
                </IconButton>
                
                <IconButton sx={{ color: 'white' }}>
                  <SkipNext />
                </IconButton>

                {/* Volume control */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
                  <IconButton onClick={toggleMute} sx={{ color: 'white' }}>
                    {volume === 0 ? <VolumeOff /> : volume < 0.5 ? <VolumeDown /> : <VolumeUp />}
                  </IconButton>
                  <Box sx={{ width: 80 }}>
                    <Slider
                      value={volume}
                      min={0}
                      max={1}
                      step={0.01}
                      onChange={handleVolumeChange}
                      sx={{
                        color: '#ff0000',
                        '& .MuiSlider-thumb': { width: 12, height: 12 },
                        '& .MuiSlider-rail': { bgcolor: 'rgba(255,255,255,0.3)' }
                      }}
                    />
                  </Box>
                </Box>

                <Box sx={{ flex: 1 }} />

                {/* Time display */}
                <Typography variant="caption" sx={{ mr: 2 }}>
                  {formatTime(currentTime)} / {formatTime(duration)}
                </Typography>

                {/* Settings and fullscreen */}
                <IconButton sx={{ color: 'white' }}>
                  <Settings />
                </IconButton>
                
                <IconButton onClick={toggleFullscreen} sx={{ color: 'white' }}>
                  <Fullscreen />
                </IconButton>
              </Box>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Play/Pause center indicator */}
        <AnimatePresence>
          {!isPlaying && showControls && (
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
                width: 80,
                height: 80,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              onClick={togglePlay}
            >
              <PlayArrow sx={{ fontSize: 50, color: 'white' }} />
            </motion.div>
          )}
        </AnimatePresence>
      </Box>
    </Card>
  );
};

export default VideoPlayer;
