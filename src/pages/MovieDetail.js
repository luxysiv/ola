import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import VideoPlayer from "../components/VideoPlayer";
import { getHistory } from "../utils/history";
import { Container, Typography, Button, Box, Chip, Stack, CircularProgress } from "@mui/material";
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

        // Lấy lịch sử xem  
        const history = getHistory();
        const historyItem = history.find(m => m.slug === slug);
        if (historyItem) setResumeData(historyItem);

        // Phân tích URL  
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
          } else {
            setSrc(null);
            setCurrentEp(null);
          }
        } else {
          setSrc(null);
          setCurrentEp(null);
        }
      })
      .catch(console.error)
      .finally(() => {
        setIsInitialLoading(false);
      });

  }, [slug, location.search]);

  const handleSelectEpisode = useCallback((ep, time = 0) => {
    if (!ep) return;
    const svSlug = normalize(servers[currentServer]?.server_name);
    const epSlug = normalize(ep.name);

    setResumeData(prev => ({ ...prev, episode: ep.name, currentTime: time }));
    navigate(`/phim/${slug}?${svSlug}&${epSlug}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [servers, currentServer, slug, navigate]);

  const handleBackToBanner = () => {
    navigate(`/phim/${slug}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleChangeServer = (index) => {
    setCurrentServer(index);
    const svSlug = normalize(servers[index]?.server_name);
    navigate(`/phim/${slug}?${svSlug}`);
  };

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
          <title>
            {currentEp
              ? `Tập ${currentEp} - ${movie.name} | KKPhim`
              : `${movie.name} (${movie.year}) | KKPhim`}
          </title>
        </Helmet>
      )}

      {src ? (
        <>
          <VideoPlayer
            key={src}
            src={src}
            title={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography
                  variant="subtitle1"
                  component="span"
                  onClick={handleBackToBanner}
                  sx={{
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    '&:hover': { color: 'error.main', textDecoration: 'underline' }
                  }}
                >
                  {movie?.name}
                </Typography>
                <Typography variant="subtitle1" component="span" sx={{ opacity: 0.8 }}>
                  - Tập {currentEp}
                </Typography>
              </Box>
            }
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

          <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 2 }}>
            {currentIndex > 0 && (
              <Button
                variant="outlined"
                startIcon={<SkipPreviousIcon />}
                onClick={() => handleSelectEpisode(episodeList[currentIndex - 1])}
              >
                Tập {episodeList[currentIndex - 1].name}
              </Button>
            )}
            {currentIndex < episodeList.length - 1 && (
              <Button
                variant="contained"
                color="error"
                endIcon={<SkipNextIcon />}
                onClick={() => handleSelectEpisode(episodeList[currentIndex + 1])}
              >
                Tập {episodeList[currentIndex + 1].name}
              </Button>
            )}
          </Stack>
        </>
      ) : (
        banner && (
          <Box
            sx={{
              width: "100%",
              height: { xs: 250, md: 450 },
              backgroundImage: `url(${banner})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              borderRadius: 2,
              mb: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              overflow: "hidden"
            }}
          >
            <Box sx={{ position: "absolute", inset: 0, bgcolor: "rgba(0,0,0,0.6)" }} />

            {resumeData && (
              <Stack direction="column" alignItems="center" spacing={2} sx={{ zIndex: 1 }}>
                <Typography variant="h6" sx={{ color: "white", textShadow: "1px 1px 4px rgba(0,0,0,0.8)" }}>
                  Bạn đang xem dở tập {resumeData.episode}
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  color="error"
                  startIcon={<ReplayIcon />}
                  sx={{ fontWeight: "bold", px: 6, py: 1.5, borderRadius: 5 }}
                  onClick={() => {
                    const epToResume = episodeList.find(e => e.name === resumeData.episode) || episodeList[0];
                    handleSelectEpisode(epToResume, resumeData.currentTime);
                  }}
                >
                  TIẾP TỤC XEM
                </Button>
              </Stack>
            )}
          </Box>
        )
      )}

      {movie && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h4" fontWeight="bold">{movie.name}</Typography>
          <Typography color="text.secondary" variant="h6">
            {movie.origin_name} ({movie.year})
          </Typography>

          <Stack direction="row" spacing={1} mt={1} mb={2}>
            <Chip label={movie.quality} color="primary" variant="outlined" size="small" />
            <Chip label={movie.lang} variant="outlined" size="small" />
            <Chip label={movie.time} variant="outlined" size="small" />
          </Stack>

          <Typography variant="body1" sx={{ lineHeight: 1.7, color: "text.primary", opacity: 0.8 }}>
            {movie.content?.replace(/<[^>]*>/g, "")}
          </Typography>
        </Box>
      )}

      <Typography sx={{ mt: 4 }} variant="h6" fontWeight="bold">Chọn Nguồn Phát (Server)</Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
        {servers.map((sv, i) => (
          <Button
            key={i}
            variant={i === currentServer ? "contained" : "outlined"}
            onClick={() => handleChangeServer(i)}
            size="small"
          >
            {sv.server_name}
          </Button>
        ))}
      </Box>

      <Typography sx={{ mt: 3 }} variant="h6" fontWeight="bold">Danh sách tập</Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))", gap: 1, mt: 1 }}>
        {episodeList.map((ep, i) => (
          <Button
            key={i}
            variant={currentEp === ep.name ? "contained" : "outlined"}
            color={currentEp === ep.name ? "error" : "primary"}
            onClick={() => handleSelectEpisode(ep)}
            sx={{ borderRadius: 1 }}
          >
            {ep.name}
          </Button>
        ))}
      </Box>
    </Container>
  );
}

export default MovieDetail;
