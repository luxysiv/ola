import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import VideoPlayer from "../components/VideoPlayer";
import { getHistory } from "../utils/history";
import { Container, Typography, Button, Box, Chip, Stack } from "@mui/material";
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';

const normalize = (str = "") =>
  str.toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d").replace(/[()#]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();

function MovieDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [movie, setMovie] = useState(null);
  const [servers, setServers] = useState([]);
  const [currentServer, setCurrentServer] = useState(0);
  const [src, setSrc] = useState(null);
  const [currentEp, setCurrentEp] = useState(null);
  const [resumeData, setResumeData] = useState(null);

  useEffect(() => {
    axios.get(`https://phimapi.com/phim/${slug}`)
      .then(res => {
        const movieData = res.data.movie;
        const epData = res.data.episodes || [];
        setMovie(movieData);
        setServers(epData);

        // Lấy lịch sử phim này
        const history = getHistory();
        const lastSeen = history.find(m => m.slug === slug);
        setResumeData(lastSeen || null);

        // Phân tích URL: ?server&episode
        const searchPath = decodeURIComponent(location.search.substring(1)); 
        const parts = searchPath.split("&").filter(Boolean);

        if (parts.length > 0) {
          const svIdx = epData.findIndex(s => normalize(s.server_name) === parts[0]);
          const activeSv = svIdx !== -1 ? svIdx : 0;
          setCurrentServer(activeSv);

          if (parts[1]) {
            const listEp = epData[activeSv]?.server_data || [];
            const ep = listEp.find(e => normalize(e.name) === parts[1]);
            if (ep) {
              setSrc(ep.link_m3u8);
              setCurrentEp(ep.name);
            }
          }
        }
      }).catch(console.error);
  }, [slug, location.search]);

  const handleSelectEpisode = useCallback((ep, time = 0) => {
    const svSlug = normalize(servers[currentServer]?.server_name);
    const epSlug = normalize(ep.name);
    setResumeData(prev => ({ ...prev, currentTime: time, episode: ep.name }));
    navigate(`/phim/${slug}?${svSlug}&${epSlug}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [servers, currentServer, slug, navigate]);

  const episodeList = servers[currentServer]?.server_data || [];
  const currentIndex = episodeList.findIndex(e => e.name === currentEp);

  const handleAutoNext = () => {
    if (currentIndex !== -1 && currentIndex < episodeList.length - 1) {
      handleSelectEpisode(episodeList[currentIndex + 1]);
    }
  };

  const banner = movie?.thumb_url || movie?.poster_url;

  return (
    <Container sx={{ mt: 2, mb: 5 }}>
      {movie && (
        <Helmet>
          <title>{currentEp ? `Tập ${currentEp} - ${movie.name}` : movie.name}</title>
        </Helmet>
      )}

      {src ? (
        <>
          <VideoPlayer
            key={src} 
            src={src}
            title={`${movie?.name} - Tập ${currentEp}`}
            onVideoEnd={handleAutoNext}
            movieInfo={{
              slug,
              name: movie?.name,
              poster: movie?.poster_url,
              episode: currentEp,
              server: servers[currentServer]?.server_name,
              currentTime: (resumeData?.episode === currentEp) ? resumeData.currentTime : 0
            }}
          />
          
          {/* Cụm nút Tập trước / Tập sau */}
          {episodeList.length > 1 && (
            <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 2 }}>
              {currentIndex > 0 && (
                <Button 
                  variant="outlined" startIcon={<SkipPreviousIcon />}
                  onClick={() => handleSelectEpisode(episodeList[currentIndex - 1])}
                >
                  Tập {episodeList[currentIndex - 1].name}
                </Button>
              )}
              {currentIndex < episodeList.length - 1 && (
                <Button 
                  variant="contained" endIcon={<SkipNextIcon />}
                  onClick={() => handleSelectEpisode(episodeList[currentIndex + 1])}
                >
                  Tập {episodeList[currentIndex + 1].name}
                </Button>
              )}
            </Stack>
          )}
        </>
      ) : (
        banner && (
          <Box sx={{ 
            width: "100%", height: { xs: 300, md: 500 }, borderRadius: 2,
            backgroundImage: `url(${banner})`, backgroundSize: "cover", backgroundPosition: "center",
            display: "flex", alignItems: "center", justifyContent: "center", position: "relative" 
          }}>
             <Box sx={{ position: "absolute", inset: 0, bgcolor: "rgba(0,0,0,0.6)", borderRadius: 2 }} />
             <Stack spacing={2} sx={{ zIndex: 1 }}>
                <Button variant="contained" color="error" size="large" onClick={() => handleSelectEpisode(episodeList[0])}>
                  XEM TỪ ĐẦU
                </Button>
                {resumeData && (
                  <Button variant="contained" color="primary" size="large"
                    onClick={() => {
                      const ep = episodeList.find(e => e.name === resumeData.episode) || episodeList[0];
                      handleSelectEpisode(ep, resumeData.currentTime);
                    }}
                  >
                    XEM TIẾP TẬP {resumeData.episode}
                  </Button>
                )}
             </Stack>
          </Box>
        )
      )}

      {/* Thông tin phim */}
      <Box sx={{ mt: 3 }}>
        <Typography variant="h4" fontWeight="bold">{movie?.name}</Typography>
        <Typography color="text.secondary">{movie?.origin_name} ({movie?.year})</Typography>
        
        <Typography variant="h6" sx={{ mt: 4, fontWeight: "bold" }}>Danh sách tập</Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: 1, mt: 1 }}>
          {episodeList.map((ep, i) => (
            <Button 
              key={i} 
              variant={currentEp === ep.name ? "contained" : "outlined"} 
              onClick={() => handleSelectEpisode(ep)}
            >
              {ep.name}
            </Button>
          ))}
        </Box>
      </Box>
    </Container>
  );
}

export default MovieDetail;
