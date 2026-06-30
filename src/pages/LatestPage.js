import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  Container, Typography, Grid, CircularProgress, Box,
  Pagination, Chip, alpha, Skeleton
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import PlayCircleFilledIcon from "@mui/icons-material/PlayCircleFilled";
import WhatshotIcon from "@mui/icons-material/Whatshot";

const getPoster = (url) => {
  if (!url) return "/no-image.jpg";
  return url.startsWith("http") ? url : `https://phimimg.com/${url}`;
};

function MovieCard({ m }) {
  const theme = useTheme();
  return (
    <Link to={`/phim/${m.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
      <Box sx={{
        transition: "transform 0.2s",
        "&:hover": { transform: "translateY(-4px)" },
        "&:hover .play-icon": { opacity: 1 },
        "&:hover .overlay": { opacity: 1 },
      }}>
        <Box sx={{ position: "relative", borderRadius: 2, overflow: "hidden" }}>
          <Box
            component="img"
            src={getPoster(m.poster_url)}
            alt={m.name}
            onError={(e) => (e.target.src = "/no-image.jpg")}
            sx={{ width: "100%", height: { xs: 200, sm: 240, md: 260 }, objectFit: "cover", display: "block" }}
          />
          <Box className="overlay" sx={{
            position: "absolute", inset: 0, opacity: 0, transition: "opacity 0.2s",
            background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 50%)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <PlayCircleFilledIcon className="play-icon" sx={{ color: "#fff", fontSize: 44 }} />
          </Box>
          {m.quality && (
            <Box sx={{
              position: "absolute", top: 6, right: 6,
              bgcolor: "primary.main", color: "#fff",
              fontSize: 10, fontWeight: 700, px: 0.8, py: 0.2, borderRadius: 1,
            }}>
              {m.quality}
            </Box>
          )}
          {m.episode_current && m.episode_current !== "Full" && (
            <Box sx={{
              position: "absolute", bottom: 6, left: 6,
              bgcolor: "rgba(0,0,0,0.75)", color: "#fff",
              fontSize: 10, fontWeight: 600, px: 0.8, py: 0.2, borderRadius: 1,
            }}>
              {m.episode_current}
            </Box>
          )}
        </Box>
        <Box sx={{ pt: 1 }}>
          <Typography variant="subtitle2" fontWeight={600} sx={{
            overflow: "hidden", display: "-webkit-box",
            WebkitLineClamp: 2, WebkitBoxOrient: "vertical", lineHeight: 1.4, fontSize: 13,
          }}>
            {m.name}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>
            {m.year}{m.lang ? ` • ${m.lang}` : ""}
          </Typography>
        </Box>
      </Box>
    </Link>
  );
}

export default function LatestPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const currentPage = parseInt(searchParams.get("trang") || "1", 10);

  const fetch = useCallback(async (page) => {
    setLoading(true);
    try {
      const res = await axios.get(`https://phimapi.com/danh-sach/phim-moi-cap-nhat-v3?page=${page}`);
      setMovies(res.data.items || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
    } catch { setMovies([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(currentPage); }, [currentPage, fetch]);

  return (
    <Container maxWidth="lg" sx={{ pt: 4, pb: 6 }}>
      <Helmet>
        <title>{`Phim Mới Cập Nhật – Trang ${currentPage} | Hdophim`}</title>
      </Helmet>

      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
        <WhatshotIcon sx={{ color: "primary.main" }} />
        <Typography variant="h5" fontWeight={700}>Phim mới cập nhật</Typography>
        {currentPage > 1 && (
          <Typography variant="body2" color="text.secondary">– Trang {currentPage}</Typography>
        )}
      </Box>

      {loading ? (
        <Grid container spacing={2}>
          {[...Array(20)].map((_, i) => (
            <Grid item xs={6} sm={4} md={3} lg={2} key={i}>
              <Skeleton variant="rectangular" height={240} sx={{ borderRadius: 2 }} animation="wave" />
              <Skeleton variant="text" sx={{ mt: 1 }} animation="wave" />
            </Grid>
          ))}
        </Grid>
      ) : (
        <>
          <Grid container spacing={{ xs: 1.5, sm: 2 }}>
            {movies.map((m) => (
              <Grid item xs={6} sm={4} md={3} lg={2} key={m._id}>
                <MovieCard m={m} />
              </Grid>
            ))}
          </Grid>

          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={5}>
              <Pagination
                count={totalPages} page={currentPage}
                onChange={(_, v) => { navigate(`/phim-moi-cap-nhat?trang=${v}`); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                color="primary" size="large" showFirstButton showLastButton
              />
            </Box>
          )}
        </>
      )}
    </Container>
  );
}
