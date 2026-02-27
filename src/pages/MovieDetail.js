import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import VideoPlayer from "../components/VideoPlayer";
import { getHistory } from "../utils/history";
import { Container, Typography, Button, Box, Chip, Stack, CircularProgress, Divider } from "@mui/material";
import SkipNextIcon from '@mui/icons-material/SkipNext';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import ReplayIcon from '@mui/icons-material/Replay';

const normalize = (str = "") =>
  str.toString().toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d").replace(/[()#]/g, "")
    .replace(/\s+/g, "-").replace(/-+/g, "-").trim();

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
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    setIsInitialLoading(true);
    axios.get(`https://phimapi.com/phim/${slug}`)
      .then(res => {
        const movieData = res.data.movie;
        const epData = res.data.episodes || [];
        setMovie(movieData);
        setServers(epData);

        const history = getHistory();
        const historyItem = history.find(m => m.slug === slug);
        if (historyItem) setResumeData(historyItem);

        const searchPath = decodeURIComponent(location.search.substring(1));
        const parts = searchPath.split("&").filter(Boolean);

        if (parts.length > 0) {
          let serverSlug = parts[0];
          let epSlug = parts[1];
          let svIdx = epData.findIndex(s => normalize(s.server_name) === serverSlug);
          if (svIdx === -1) svIdx = 0;
          setCurrentServer(svIdx);

          const listEp = epData[svIdx]?.server_data || [];
          if (epSlug) {
            let epIdx = listEp.findIndex(e => normalize(e.name) === epSlug);
            if (epIdx === -1) epIdx = 0;
            if (listEp[epIdx]) {
              setSrc(listEp[epIdx].link_m3u8);
              setCurrentEp(listEp[epIdx].name);
            }
          }
        }
      })
      .catch(console.error)
      .finally(() => setIsInitialLoading(false));
  }, [slug, location.search]);

  const handleSelectEpisode = useCallback((ep, time = 0) => {
    if (!ep) return;
    const svSlug = normalize(servers[currentServer]?.server_name);
    const epSlug = normalize(ep.name);
    setResumeData(prev => ({ ...prev, episode: ep.name, currentTime: time }));
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

  if (isInitialLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
        <CircularProgress color="error" />
      </Box>
    );
  }

  const banner = movie?.thumb_url || movie?.poster_url;

  return (
    <Container sx={{ mt: 2, mb: 5 }}>
      {movie && (
        <Helmet>
          <title>{currentEp ? `${currentEp} - ${movie.name}` : `${movie.name} (${movie.year})`}</title>
        </Helmet>
      )}

      {src ? (
        <>
          <VideoPlayer
            key={src}
            src={src}
            title={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="subtitle1" component="span" onClick={() => navigate(`/phim/${slug}`)} sx={{ cursor: 'pointer', fontWeight: 'bold', '&:hover': { color: 'error.main' } }}>
                  {movie?.name}
                </Typography>
                <Typography variant="subtitle1" component="span" sx={{ opacity: 0.8 }}> - {currentEp}</Typography>
              </Box>
            }
            onVideoEnd={handleAutoNext}
            movieInfo={{
              slug, name: movie?.name, poster: movie?.poster_url, episode: currentEp,
              server: servers[currentServer]?.server_name,
              currentTime: (resumeData?.episode === currentEp) ? resumeData.currentTime : 0
            }}
          />

          <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 2 }}>
            {currentIndex > 0 && (
              <Button variant="outlined" startIcon={<SkipPreviousIcon />} onClick={() => handleSelectEpisode(episodeList[currentIndex - 1])}>
                {episodeList[currentIndex - 1].name}
              </Button>
            )}
            {currentIndex < episodeList.length - 1 && (
              <Button variant="contained" color="error" endIcon={<SkipNextIcon />} onClick={() => handleSelectEpisode(episodeList[currentIndex + 1])}>
                {episodeList[currentIndex + 1].name}
              </Button>
            )}
          </Stack>
        </>
      ) : (
        banner && (
          <Box sx={{ width: "100%", height: { xs: 250, md: 450 }, backgroundImage: `url(${banner})`, backgroundSize: "cover", backgroundPosition: "center", borderRadius: 2, mb: 2, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
            <Box sx={{ position: "absolute", inset: 0, bgcolor: "rgba(0,0,0,0.6)" }} />
            {resumeData && (
              <Button 
                variant="contained" size="large" color="error" startIcon={<ReplayIcon />} 
                sx={{ zIndex: 1, fontWeight: "bold", px: 4, borderRadius: 5 }}
                onClick={() => {
                  const epToResume = episodeList.find(e => e.name === resumeData.episode) || episodeList[0];
                  handleSelectEpisode(epToResume, resumeData.currentTime);
                }}
              >
                TIẾP TỤC XEM {resumeData.episode.toUpperCase()}
              </Button>
            )}
          </Box>
        )
      )}

      {movie && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h4" fontWeight="bold">{movie.name}</Typography>
          <Typography color="text.secondary" variant="h6" sx={{ mb: 1 }}>{movie.origin_name} ({movie.year})</Typography>

          <Stack direction="row" spacing={1} mb={2}>
            <Chip label={movie.quality} color="primary" size="small" />
            <Chip label={movie.lang} variant="outlined" size="small" />
            <Chip label={movie.country?.map(c => c.name).join(", ")} variant="outlined" size="small" />
          </Stack>

          <Box sx={{ bgcolor: "background.paper", p: 2, borderRadius: 2, mb: 2 }}>
            <Typography variant="body2" gutterBottom><strong>Đạo diễn:</strong> {movie.director?.join(", ") || "Đang cập nhật"}</Typography>
            <Typography variant="body2" gutterBottom><strong>Diễn viên:</strong> {movie.actor?.join(", ") || "Đang cập nhật"}</Typography>
            <Typography variant="body2"><strong>Quốc gia:</strong> {movie.country?.map(c => c.name).join(", ")}</Typography>
          </Box>

          <Typography variant="body1" sx={{ opacity: 0.8, lineHeight: 1.8 }}>
            {movie.content?.replace(/<[^>]*>/g, "")}
          </Typography>
        </Box>
      )}

      <Divider sx={{ my: 3 }} />

      <Typography variant="h6" fontWeight="bold">Server</Typography>
      <Stack direction="row" spacing={1} mt={1} flexWrap="wrap">
        {servers.map((sv, i) => (
          <Button key={i} variant={i === currentServer ? "contained" : "outlined"} onClick={() => handleChangeServer(i)} size="small">
            {sv.server_name}
          </Button>
        ))}
      </Stack>

      <Typography sx={{ mt: 3 }} variant="h6" fontWeight="bold">Danh sách tập</Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 1, mt: 1 }}>
        {episodeList.map((ep, i) => (
          <Button key={i} variant={currentEp === ep.name ? "contained" : "outlined"} color={currentEp === ep.name ? "error" : "primary"} onClick={() => handleSelectEpisode(ep)}>
            {ep.name}
          </Button>
        ))}
      </Box>
    </Container>
  );
}

export default MovieDetail;
