import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import VideoPlayer from "../components/VideoPlayer";
import { getHistory } from "../utils/history";
import {
  Container, Typography, Button, Box, Chip,
  Stack, CircularProgress, Divider, alpha, Skeleton
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import SkipNextIcon from "@mui/icons-material/SkipNext";
import SkipPreviousIcon from "@mui/icons-material/SkipPrevious";
import ReplayIcon from "@mui/icons-material/Replay";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import PublicIcon from "@mui/icons-material/Public";

const normalize = (str = "") =>
  str.toString().toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d").replace(/[()#]/g, "")
    .replace(/\s+/g, "-").replace(/-+/g, "-").trim();

function MovieDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();

  const [movie, setMovie] = useState(null);
  const [servers, setServers] = useState([]);
  const [currentServer, setCurrentServer] = useState(0);
  const [src, setSrc] = useState(null);
  const [currentEp, setCurrentEp] = useState(null);
  const [resumeData, setResumeData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axios.get(`https://phimapi.com/phim/${slug}`)
      .then((res) => {
        const movieData = res.data.movie;
        const epData = res.data.episodes || [];
        setMovie(movieData);
        setServers(epData);

        const history = getHistory();
        const historyItem = history.find((m) => m.slug === slug);
        if (historyItem) setResumeData(historyItem);

        const searchPath = decodeURIComponent(location.search.substring(1));
        const parts = searchPath.split("&").filter(Boolean);
        if (parts.length > 0) {
          let svIdx = epData.findIndex((s) => normalize(s.server_name) === parts[0]);
          if (svIdx === -1) svIdx = 0;
          setCurrentServer(svIdx);
          const listEp = epData[svIdx]?.server_data || [];
          if (parts[1]) {
            let epIdx = listEp.findIndex((e) => normalize(e.name) === parts[1]);
            if (epIdx === -1) epIdx = 0;
            if (listEp[epIdx]) { setSrc(listEp[epIdx].link_m3u8); setCurrentEp(listEp[epIdx].name); }
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [slug, location.search]);

  const handleSelectEpisode = useCallback((ep, time = 0) => {
    if (!ep) return;
    const svSlug = normalize(servers[currentServer]?.server_name);
    const epSlug = normalize(ep.name);
    setResumeData((prev) => ({ ...prev, episode: ep.name, currentTime: time }));
    navigate(`/phim/${slug}?${svSlug}&${epSlug}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [servers, currentServer, slug, navigate]);

  const episodeList = servers[currentServer]?.server_data || [];
  const currentIndex = episodeList.findIndex((e) => e.name === currentEp);

  if (loading) {
    return (
      <Container sx={{ mt: 3 }}>
        <Skeleton variant="rectangular" height={420} sx={{ borderRadius: 2, mb: 3 }} animation="wave" />
        <Skeleton variant="text" height={48} width="60%" animation="wave" />
        <Skeleton variant="text" height={28} width="40%" animation="wave" />
      </Container>
    );
  }

  const banner = movie?.thumb_url || movie?.poster_url;

  return (
    <Container maxWidth="lg" sx={{ pt: 2, pb: 6 }}>
      {movie && (
        <Helmet>
          <title>{currentEp ? `${currentEp} – ${movie.name}` : `${movie.name} (${movie.year})`}</title>
        </Helmet>
      )}

      {/* Video player or banner */}
      {src ? (
        <>
          <VideoPlayer
            key={src} src={src}
            title={
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Typography
                  variant="subtitle1" component="span"
                  onClick={() => { setSrc(null); setCurrentEp(null); navigate(`/phim/${slug}`); }}
                  sx={{ cursor: "pointer", fontWeight: 700, "&:hover": { color: "primary.main" } }}
                >
                  {movie?.name}
                </Typography>
                <Typography variant="subtitle1" component="span" sx={{ opacity: 0.6 }}>
                  {" "}– {currentEp}
                </Typography>
              </Box>
            }
            onVideoEnd={() => {
              if (currentIndex !== -1 && currentIndex < episodeList.length - 1) {
                handleSelectEpisode(episodeList[currentIndex + 1]);
              }
            }}
            movieInfo={{
              slug, name: movie?.name, poster: movie?.poster_url, thumb: movie?.thumb_url,
              episode: currentEp, server: servers[currentServer]?.server_name,
              currentTime: (resumeData?.episode === currentEp) ? resumeData.currentTime : 0,
            }}
          />

          {/* Prev / Next nav */}
          {episodeList.length > 1 && (
            <Stack direction="row" spacing={1.5} justifyContent="center" sx={{ mt: 2 }}>
              {currentIndex > 0 && (
                <Button variant="outlined" size="small" startIcon={<SkipPreviousIcon />}
                  onClick={() => handleSelectEpisode(episodeList[currentIndex - 1])}
                  sx={{ borderRadius: 2 }}>
                  {episodeList[currentIndex - 1].name}
                </Button>
              )}
              {currentIndex < episodeList.length - 1 && (
                <Button variant="contained" color="primary" size="small" endIcon={<SkipNextIcon />}
                  onClick={() => handleSelectEpisode(episodeList[currentIndex + 1])}
                  sx={{ borderRadius: 2 }}>
                  {episodeList[currentIndex + 1].name}
                </Button>
              )}
            </Stack>
          )}
        </>
      ) : (
        banner && (
          <Box sx={{
            width: "100%", height: { xs: 260, sm: 380, md: 480 },
            backgroundImage: `url(${banner})`,
            backgroundSize: "cover", backgroundPosition: "center top",
            borderRadius: 2, mb: 3, position: "relative", overflow: "hidden",
            display: "flex", alignItems: "flex-end",
          }}>
            <Box sx={{
              position: "absolute", inset: 0,
              background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)",
            }} />
            <Box sx={{ position: "relative", p: { xs: 2.5, md: 4 }, zIndex: 1 }}>
              <Typography variant="h5" fontWeight={800} sx={{ color: "#fff", mb: 0.5, textShadow: "0 2px 8px rgba(0,0,0,0.7)" }}>
                {movie?.name}
              </Typography>
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.65)", mb: 2 }}>
                {movie?.origin_name} • {movie?.year}
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                {resumeData ? (
                  <Button variant="contained" color="primary" size="large"
                    startIcon={<ReplayIcon />}
                    sx={{ fontWeight: 700, borderRadius: 2, boxShadow: "0 4px 20px rgba(229,9,20,0.4)" }}
                    onClick={() => {
                      const ep = episodeList.find((e) => e.name === resumeData.episode) || episodeList[0];
                      handleSelectEpisode(ep, resumeData.currentTime);
                    }}>
                    Tiếp tục {resumeData.episode}
                  </Button>
                ) : (
                  <Button variant="contained" color="primary" size="large"
                    startIcon={<PlayArrowIcon />}
                    sx={{ fontWeight: 700, borderRadius: 2, boxShadow: "0 4px 20px rgba(229,9,20,0.4)" }}
                    onClick={() => handleSelectEpisode(episodeList[0])}>
                    Xem ngay
                  </Button>
                )}
              </Stack>
            </Box>
          </Box>
        )
      )}

      {/* Movie Info */}
      {movie && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h4" fontWeight={800} sx={{ lineHeight: 1.2 }}>{movie.name}</Typography>
          <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 0.5 }}>
            {movie.origin_name}
          </Typography>

          {/* Meta chips */}
          <Stack direction="row" spacing={1} mt={1.5} mb={2} flexWrap="wrap" useFlexGap>
            {movie.quality && <Chip label={movie.quality} color="primary" size="small" sx={{ fontWeight: 700 }} />}
            {movie.lang && <Chip label={movie.lang} size="small" variant="outlined" />}
            {movie.episode_current && <Chip label={movie.episode_current} size="small" color="success" variant="outlined" />}
          </Stack>

          {/* Info grid */}
          <Box sx={{
            bgcolor: "background.paper", p: 2.5, borderRadius: 2, mb: 3,
            border: `1px solid ${theme.palette.divider}`,
            display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.5,
          }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CalendarMonthIcon sx={{ fontSize: 16, color: "text.secondary" }} />
              <Typography variant="body2"><Box component="span" fontWeight={600}>Năm:</Box> {movie.year}</Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <AccessTimeIcon sx={{ fontSize: 16, color: "text.secondary" }} />
              <Typography variant="body2"><Box component="span" fontWeight={600}>Thời lượng:</Box> {movie.time}</Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
              <PublicIcon sx={{ fontSize: 16, color: "text.secondary", mt: "2px" }} />
              <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 0.5 }}>
                <Typography variant="body2" fontWeight={600}>Quốc gia:</Typography>
                {movie.country?.map((c) => (
                  <Chip key={c.id} label={c.name} size="small" clickable component={Link}
                    to={`/quoc-gia/${c.slug}`}
                    sx={{ fontSize: "0.7rem", height: 20 }} />
                ))}
              </Box>
            </Box>
            <Box>
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                <Typography variant="body2" fontWeight={600} sx={{ whiteSpace: "nowrap" }}>Thể loại:</Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                  {movie.category?.map((cat) => (
                    <Chip key={cat.id} label={cat.name} size="small" variant="outlined" clickable
                      component={Link} to={`/the-loai/${cat.slug}`}
                      sx={{ fontSize: "0.7rem", height: 20 }} />
                  ))}
                </Box>
              </Box>
            </Box>
            {movie.director?.[0] && movie.director[0] !== "Đang cập nhật" && (
              <Box sx={{ gridColumn: "1 / -1" }}>
                <Typography variant="body2"><Box component="span" fontWeight={600}>Đạo diễn:</Box> {movie.director.join(", ")}</Typography>
              </Box>
            )}
            {movie.actor?.length > 0 && (
              <Box sx={{ gridColumn: "1 / -1" }}>
                <Typography variant="body2" sx={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  <Box component="span" fontWeight={600}>Diễn viên:</Box> {movie.actor.join(", ")}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Description */}
          {movie.content && (
            <Typography variant="body2" sx={{ lineHeight: 1.8, color: "text.secondary", mb: 3 }}>
              {movie.content.replace(/<[^>]*>/g, "")}
            </Typography>
          )}
        </Box>
      )}

      <Divider sx={{ my: 3 }} />

      {/* Server selector */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>Nguồn phát</Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {servers.map((sv, i) => (
            <Button
              key={i} size="small"
              variant={i === currentServer ? "contained" : "outlined"}
              color={i === currentServer ? "primary" : "inherit"}
              onClick={() => {
                setCurrentServer(i);
                navigate(`/phim/${slug}?${normalize(servers[i]?.server_name)}`);
              }}
              sx={{ borderRadius: 2, minWidth: 100 }}
            >
              {sv.server_name}
            </Button>
          ))}
        </Stack>
      </Box>

      {/* Episode list */}
      <Box>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
          Danh sách tập{episodeList.length > 1 ? ` (${episodeList.length} tập)` : ""}
        </Typography>
        <Box sx={{
          display: "grid",
          gridTemplateColumns: episodeList.length > 50
            ? "repeat(auto-fill, minmax(72px, 1fr))"
            : "repeat(auto-fill, minmax(100px, 1fr))",
          gap: 1,
        }}>
          {episodeList.map((ep, i) => (
            <Button
              key={i}
              size={episodeList.length > 50 ? "small" : "medium"}
              variant={currentEp === ep.name ? "contained" : "outlined"}
              color={currentEp === ep.name ? "primary" : "inherit"}
              onClick={() => handleSelectEpisode(ep)}
              sx={{
                borderRadius: 1.5, fontWeight: currentEp === ep.name ? 700 : 400,
                fontSize: episodeList.length > 50 ? 12 : 13,
                bgcolor: currentEp === ep.name ? undefined : alpha(theme.palette.background.paper, 0.5),
              }}
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
