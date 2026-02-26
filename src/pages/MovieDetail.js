import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import VideoPlayer from "../components/VideoPlayer";
import { getHistory } from "../utils/history";
import { Container, Typography, Button, Box, Chip, Stack, CircularProgress } from "@mui/material";
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
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
          let svIdx = epData.findIndex(s => normalize(s.server_name) === parts[0]);
          if (svIdx === -1) svIdx = 0;
          setCurrentServer(svIdx);

          const listEp = epData[svIdx]?.server_data || [];
          if (parts[1]) {
            let ep = listEp.find(e => normalize(e.name) === parts[1]);
            if (ep) {
              setSrc(ep.link_m3u8);
              setCurrentEp(ep.name);
            }
          }
        }
      })
      .catch(console.error)
      .finally(() => setIsInitialLoading(false));
  }, [slug, location.search]);

  // Sửa hàm: Nhận thêm tham số resetTime
  const handleSelectEpisode = useCallback((ep, time = 0, resetTime = false) => {
    const svSlug = normalize(servers[currentServer]?.server_name);
    const epSlug = normalize(ep.name);
    
    // Nếu nhấn "Xem từ đầu", ép thời gian về 0
    const finalTime = resetTime ? 0 : time;
    setResumeData(prev => ({ ...prev, episode: ep.name, currentTime: finalTime }));
    
    navigate(`/phim/${slug}?${svSlug}&${epSlug}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [servers, currentServer, slug, navigate]);

  const handleBackToBanner = () => {
    navigate(`/phim/${slug}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
  const isSingleEpisode = episodeList.length <= 1;

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
            title={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="subtitle1" component="span" onClick={handleBackToBanner}
                  sx={{ cursor: 'pointer', fontWeight: 'bold', '&:hover': { color: 'error.main', textDecoration: 'underline' } }}>
                  {movie?.name}
                </Typography>
                {!isSingleEpisode && (
                  <Typography variant="subtitle1" component="span" sx={{ opacity: 0.8 }}>
                    - Tập {currentEp}
                  </Typography>
                )}
              </Box>
            }
            onVideoEnd={handleAutoNext}
            movieInfo={{
              slug, name: movie?.name, poster: movie?.poster_url, episode: currentEp,
              server: servers[currentServer]?.server_name,
              currentTime: (resumeData?.episode === currentEp) ? resumeData.currentTime : 0
            }}
          />

          {/* Điều hướng tập (Ẩn nếu chỉ có 1 tập) */}
          {!isSingleEpisode && (
            <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 2 }}>
              {currentIndex > 0 && (
                <Button variant="outlined" startIcon={<SkipPreviousIcon />} onClick={() => handleSelectEpisode(episodeList[currentIndex - 1])}>
                  Tập {episodeList[currentIndex - 1].name}
                </Button>
              )}
              {currentIndex < episodeList.length - 1 && (
                <Button variant="contained" color="error" endIcon={<SkipNextIcon />} onClick={() => handleSelectEpisode(episodeList[currentIndex + 1])}>
                  Tập {episodeList[currentIndex + 1].name}
                </Button>
              )}
            </Stack>
          )}
        </>
      ) : (
        banner && (
          <Box sx={{ width: "100%", height: { xs: 250, md: 450 }, backgroundImage: `url(${banner})`, backgroundSize: "cover", backgroundPosition: "center", borderRadius: 2, mb: 2, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
            <Box sx={{ position: "absolute", inset: 0, bgcolor: "rgba(0,0,0,0.5)", borderRadius: 2 }} />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ zIndex: 1 }}>
              <Button 
                variant="contained" size="large" color="error" startIcon={<PlayArrowIcon />}
                onClick={() => handleSelectEpisode(episodeList[0], 0, true)} // Gửi true để reset về 0:00
              >
                XEM TỪ ĐẦU
              </Button>

              {resumeData && (
                <Button 
                  variant="contained" size="large" color="primary" startIcon={<ReplayIcon />}
                  onClick={() => {
                    const epToResume = episodeList.find(e => e.name === resumeData.episode) || episodeList[0];
                    handleSelectEpisode(epToResume, resumeData.currentTime);
                  }}
                >
                  {isSingleEpisode ? "XEM TIẾP" : `XEM TIẾP TẬP ${resumeData.episode}`}
                </Button>
              )}
            </Stack>
          </Box>
        )
      )}

      {/* Thông tin phim & Danh sách tập (Giữ nguyên phần dưới) */}
      {movie && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h4" fontWeight="bold">{movie.name}</Typography>
          <Typography color="text.secondary" variant="h6">{movie.origin_name} ({movie.year})</Typography>
          <Typography variant="body1" sx={{ mt: 2, opacity: 0.8 }}>{movie.content?.replace(/<[^>]*>/g, "")}</Typography>
        </Box>
      )}

      {!isSingleEpisode && (
        <>
          <Typography sx={{ mt: 4 }} variant="h6" fontWeight="bold">Danh sách tập</Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))", gap: 1, mt: 1 }}>
            {episodeList.map((ep, i) => (
              <Button key={i} variant={currentEp === ep.name ? "contained" : "outlined"} color={currentEp === ep.name ? "error" : "primary"} onClick={() => handleSelectEpisode(ep)}>
                {ep.name}
              </Button>
            ))}
          </Box>
        </>
      )}
    </Container>
  );
}

export default MovieDetail;
