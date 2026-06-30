import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  Container, Typography, Box, Card, CardMedia, CardContent,
  Button, Skeleton, Chip, alpha
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation, EffectFade } from "swiper/modules";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import WhatshotIcon from "@mui/icons-material/Whatshot";
import PlayCircleFilledIcon from "@mui/icons-material/PlayCircleFilled";

import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import "swiper/css/effect-fade";

import { getHistory } from "../utils/history";

const getPosterUrl = (url) => {
  if (!url) return "/no-image.jpg";
  return url.startsWith("https://") ? url : `https://phimimg.com/${url}`;
};

const normalize = (str = "") =>
  str.toString().toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d").replace(/[()#]/g, "")
    .replace(/\s+/g, "-").replace(/-+/g, "-").trim();

/* ---- Skeleton ---- */
function CardSkeleton() {
  return (
    <Box sx={{ minWidth: 140, flexShrink: 0 }}>
      <Skeleton variant="rectangular" height={210} sx={{ borderRadius: 2 }} animation="wave" />
      <Skeleton variant="text" sx={{ mt: 1 }} animation="wave" />
      <Skeleton variant="text" width="60%" animation="wave" />
    </Box>
  );
}

/* ---- Hero Banner ---- */
function HeroBanner({ movies }) {
  const theme = useTheme();
  if (!movies.length) return <Skeleton variant="rectangular" height={520} sx={{ borderRadius: 3, mb: 6 }} animation="wave" />;

  return (
    <Box sx={{ mb: 6, borderRadius: 3, overflow: "hidden", position: "relative" }}>
      <Swiper
        modules={[Autoplay, Pagination, Navigation, EffectFade]}
        effect="fade"
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        pagination={{ clickable: true }}
        navigation
        loop
        style={{ width: "100%", height: "clamp(300px, 55vw, 540px)" }}
      >
        {movies.slice(0, 10).map((m) => (
          <SwiperSlide key={m._id}>
            <Link to={`/phim/${m.slug}`} style={{ display: "block", width: "100%", height: "100%" }}>
              <Box
                sx={{
                  width: "100%", height: "100%", position: "relative",
                  backgroundImage: `url(${getPosterUrl(m.thumb_url || m.poster_url)})`,
                  backgroundSize: "cover", backgroundPosition: "center top",
                }}
              >
                {/* Gradient overlay */}
                <Box sx={{
                  position: "absolute", inset: 0,
                  background: "linear-gradient(to right, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)",
                }} />
                <Box sx={{
                  position: "absolute", inset: 0,
                  background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)",
                }} />

                {/* Content */}
                <Box sx={{
                  position: "absolute", bottom: 0, left: 0, p: { xs: 3, md: 5 },
                  maxWidth: { xs: "100%", md: "55%" },
                }}>
                  <Box sx={{ display: "flex", gap: 1, mb: 1.5, flexWrap: "wrap" }}>
                    {m.quality && (
                      <Chip label={m.quality} size="small"
                        sx={{ bgcolor: "primary.main", color: "#fff", fontWeight: 700, fontSize: 11 }} />
                    )}
                    {m.lang && (
                      <Chip label={m.lang} size="small" variant="outlined"
                        sx={{ borderColor: "rgba(255,255,255,0.5)", color: "#fff", fontSize: 11 }} />
                    )}
                  </Box>
                  <Typography
                    variant="h4"
                    sx={{
                      color: "#fff", fontWeight: 800,
                      fontSize: { xs: "1.3rem", md: "2rem" },
                      lineHeight: 1.2, mb: 0.5,
                      textShadow: "0 2px 8px rgba(0,0,0,0.6)",
                    }}
                  >
                    {m.name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.65)", mb: 2, fontSize: 13 }}>
                    {m.origin_name} • {m.year}
                  </Typography>
                  <Button
                    variant="contained" color="primary"
                    startIcon={<PlayCircleFilledIcon />}
                    sx={{ fontWeight: 700, px: 3, borderRadius: 2, boxShadow: "0 4px 20px rgba(229,9,20,0.4)" }}
                  >
                    Xem ngay
                  </Button>
                </Box>
              </Box>
            </Link>
          </SwiperSlide>
        ))}
      </Swiper>
    </Box>
  );
}

/* ---- Section Header ---- */
function SectionTitle({ title, link, icon }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        {icon && <Box sx={{ color: "primary.main" }}>{icon}</Box>}
        <Typography variant="h6" fontWeight={700} sx={{ position: "relative",
          "&::after": {
            content: '""', position: "absolute", bottom: -4, left: 0,
            width: 32, height: 3, bgcolor: "primary.main", borderRadius: 2,
          },
        }}>
          {title}
        </Typography>
      </Box>
      <Button
        component={Link} to={link} size="small" endIcon={<ArrowForwardIcon fontSize="small" />}
        sx={{ color: "text.secondary", fontSize: 13, "&:hover": { color: "primary.main" } }}
      >
        Xem thêm
      </Button>
    </Box>
  );
}

/* ---- Movie Card ---- */
function MovieCard({ movie, historyEp }) {
  const theme = useTheme();
  return (
    <Box
      sx={{
        minWidth: 148, maxWidth: 148, flexShrink: 0,
        transition: "transform 0.2s",
        "&:hover": { transform: "translateY(-4px)" },
        "&:hover .overlay": { opacity: 1 },
      }}
    >
      <Box sx={{ position: "relative", borderRadius: 2, overflow: "hidden" }}>
        <Box
          component="img"
          src={getPosterUrl(movie.poster_url || movie.poster)}
          alt={movie.name}
          onError={(e) => (e.target.src = "/no-image.jpg")}
          sx={{ width: "100%", height: 210, objectFit: "cover", display: "block" }}
        />
        {/* Hover overlay */}
        <Box className="overlay" sx={{
          position: "absolute", inset: 0, opacity: 0, transition: "opacity 0.2s",
          background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 60%)",
          display: "flex", alignItems: "flex-end", p: 1.5,
        }}>
          <PlayCircleFilledIcon sx={{ color: "#fff", fontSize: 32, mx: "auto", mb: 1 }} />
        </Box>
        {/* Quality badge */}
        {movie.quality && (
          <Box sx={{
            position: "absolute", top: 6, right: 6,
            bgcolor: "primary.main", color: "#fff",
            fontSize: 10, fontWeight: 700, px: 0.8, py: 0.2, borderRadius: 1,
          }}>
            {movie.quality}
          </Box>
        )}
      </Box>
      <Box sx={{ pt: 1 }}>
        <Typography variant="subtitle2" noWrap fontWeight={600} sx={{ fontSize: 13 }}>
          {movie.name}
        </Typography>
        {historyEp ? (
          <Typography variant="caption" sx={{ color: "primary.main", fontSize: 11 }}>
            Đang xem: {historyEp}
          </Typography>
        ) : (
          <Typography variant="caption" sx={{ color: "text.secondary", fontSize: 11 }}>
            {movie.year}{movie.quality ? ` • ${movie.quality}` : ""}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

/* ---- Horizontal Row ---- */
function MovieRow({ title, link, movies, isHistory = false, icon, loading }) {
  return (
    <Box sx={{ mb: 5 }}>
      <SectionTitle title={title} link={link} icon={icon} />
      <Box sx={{
        display: "flex", gap: 2, overflowX: "auto", pb: 1,
        scrollbarWidth: "thin",
        "&::-webkit-scrollbar": { height: 4 },
        "&::-webkit-scrollbar-thumb": { bgcolor: "rgba(229,9,20,0.3)", borderRadius: 2 },
      }}>
        {loading
          ? [...Array(7)].map((_, i) => <CardSkeleton key={i} />)
          : movies.map((m, i) => {
            const movieLink = isHistory
              ? `/phim/${m.slug}?${normalize(m.server)}&${normalize(m.episode)}`
              : `/phim/${m.slug}`;
            return (
              <Link key={m._id || i} to={movieLink} style={{ textDecoration: "none", color: "inherit", flexShrink: 0 }}>
                <MovieCard movie={m} historyEp={isHistory ? m.episode : null} />
              </Link>
            );
          })}
      </Box>
    </Box>
  );
}

/* ---- Home ---- */
export default function Home() {
  const [latest, setLatest] = useState([]);
  const [hanhDong, setHanhDong] = useState([]);
  const [hanQuoc, setHanQuoc] = useState([]);
  const [phimBo, setPhimBo] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axios.get("https://phimapi.com/danh-sach/phim-moi-cap-nhat-v3?page=1"),
      axios.get("https://phimapi.com/v1/api/the-loai/hanh-dong?page=1"),
      axios.get("https://phimapi.com/v1/api/quoc-gia/han-quoc?page=1"),
      axios.get("https://phimapi.com/v1/api/danh-sach/phim-bo?page=1"),
    ])
      .then(([latestRes, catRes, countryRes, typeRes]) => {
        setLatest(latestRes.data.items || []);
        setHanhDong(catRes.data.data.items || []);
        setHanQuoc(countryRes.data.data.items || []);
        setPhimBo(typeRes.data.data.items || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    setHistory(getHistory());
  }, []);

  return (
    <Container maxWidth="lg" sx={{ pt: 4, pb: 6 }}>
      <Helmet>
        <title>Hdophim – Xem phim trực tuyến miễn phí Full HD</title>
        <meta name="description" content="Xem phim mới nhất, phim hành động, phim bộ, phim lẻ chất lượng cao Vietsub." />
      </Helmet>

      {/* Hero */}
      <HeroBanner movies={latest} />

      {/* History */}
      {history.length > 0 && (
        <MovieRow
          title="Tiếp tục xem"
          link="/lich-su"
          movies={history}
          isHistory
          loading={false}
        />
      )}

      {/* Sections */}
      <MovieRow title="Phim mới cập nhật" link="/phim-moi-cap-nhat"
        movies={latest} loading={loading}
        icon={<WhatshotIcon sx={{ fontSize: 20 }} />} />
      <MovieRow title="Phim Hành Động" link="/the-loai/hanh-dong" movies={hanhDong} loading={loading} />
      <MovieRow title="Phim Hàn Quốc" link="/quoc-gia/han-quoc" movies={hanQuoc} loading={loading} />
      <MovieRow title="Phim Bộ Mới" link="/danh-sach/phim-bo" movies={phimBo} loading={loading} />
    </Container>
  );
}
