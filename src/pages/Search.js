import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  Container, TextField, Button, Grid, Typography,
  Pagination, Autocomplete, CircularProgress, Box,
  InputAdornment, Skeleton, alpha
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import SearchIcon from "@mui/icons-material/Search";
import PlayCircleFilledIcon from "@mui/icons-material/PlayCircleFilled";

const buildImageUrl = (url, cdn) => {
  if (!url) return "/no-image.jpg";
  if (url.startsWith("http")) return url;
  return cdn ? `${cdn}/${url.replace(/^\/+/, "")}` : "/no-image.jpg";
};

function MovieCard({ movie, cdn }) {
  return (
    <Link to={`/phim/${movie.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
      <Box sx={{
        transition: "transform 0.2s",
        "&:hover": { transform: "translateY(-4px)" },
        "&:hover .play-icon": { opacity: 1 },
        "&:hover .overlay": { opacity: 1 },
      }}>
        <Box sx={{ position: "relative", borderRadius: 2, overflow: "hidden" }}>
          <Box
            component="img"
            src={buildImageUrl(movie.poster_url || movie.thumb_url, cdn)}
            alt={movie.name}
            onError={(e) => (e.target.src = "/no-image.jpg")}
            sx={{ width: "100%", height: { xs: 200, sm: 250, md: 280 }, objectFit: "cover", display: "block" }}
          />
          <Box className="overlay" sx={{
            position: "absolute", inset: 0, opacity: 0, transition: "opacity 0.2s",
            background: "rgba(0,0,0,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <PlayCircleFilledIcon className="play-icon" sx={{ color: "#fff", fontSize: 48 }} />
          </Box>
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
          <Typography variant="subtitle2" noWrap fontWeight={600} sx={{ fontSize: 13 }}>{movie.name}</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>
            {movie.year}{movie.quality ? ` • ${movie.quality}` : ""}
          </Typography>
        </Box>
      </Box>
    </Link>
  );
}

export default function Search() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryKeyword = searchParams.get("tu-khoa") || "";
  const currentPage = parseInt(searchParams.get("trang") || "1", 10);

  const [keyword, setKeyword] = useState(queryKeyword);
  const [results, setResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [cdn, setCdn] = useState("");
  const [seoTitle, setSeoTitle] = useState("Tìm kiếm phim");

  const handleSearch = useCallback(async (page, kw, shouldNavigate = true) => {
    if (!kw?.trim()) return;
    setLoading(true);
    try {
      const res = await axios.get(`https://phimapi.com/v1/api/tim-kiem?keyword=${encodeURIComponent(kw)}&page=${page}`);
      const data = res.data.data;
      setResults(data.items || []);
      setCdn(data.APP_DOMAIN_CDN_IMAGE || "");
      setTotalPages(data.params?.pagination?.totalPages || 1);
      setSeoTitle(data.titlePage || `Tìm kiếm: ${kw}`);
      if (shouldNavigate) navigate(`/tim-kiem?tu-khoa=${encodeURIComponent(kw)}&trang=${page}`);
    } catch { setResults([]); }
    finally { setLoading(false); }
  }, [navigate]);

  useEffect(() => {
    if (queryKeyword) { handleSearch(currentPage, queryKeyword, false); setKeyword(queryKeyword); }
  }, [queryKeyword, currentPage]);

  useEffect(() => {
    if (keyword.length < 2) return setSuggestions([]);
    const t = setTimeout(async () => {
      try {
        const res = await axios.get(`https://phimapi.com/v1/api/tim-kiem?keyword=${encodeURIComponent(keyword)}`);
        setSuggestions((res.data.data.items || []).slice(0, 6).map((i) => i.name));
      } catch { setSuggestions([]); }
    }, 400);
    return () => clearTimeout(t);
  }, [keyword]);

  return (
    <Container maxWidth="lg" sx={{ pt: 4, pb: 6 }}>
      <Helmet>
        <title>{seoTitle} | Hdophim</title>
      </Helmet>

      {/* Search bar */}
      <Box sx={{ maxWidth: 600, mx: "auto", mb: 5 }}>
        <Typography variant="h5" fontWeight={700} textAlign="center" sx={{ mb: 2.5 }}>
          Tìm kiếm phim
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Autocomplete
            freeSolo options={suggestions} inputValue={keyword}
            onInputChange={(_, val) => setKeyword(val)}
            sx={{ flex: 1 }}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Nhập tên phim..."
                size="medium"
                onKeyDown={(e) => e.key === "Enter" && handleSearch(1, keyword)}
                InputProps={{
                  ...params.InputProps,
                  startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: "text.secondary" }} /></InputAdornment>,
                }}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3 } }}
              />
            )}
          />
          <Button
            variant="contained" size="large" onClick={() => handleSearch(1, keyword)}
            sx={{ borderRadius: 3, px: 3, fontWeight: 700 }}
          >
            Tìm
          </Button>
        </Box>
      </Box>

      {/* Results */}
      {loading ? (
        <Grid container spacing={2}>
          {[...Array(12)].map((_, i) => (
            <Grid item xs={6} sm={4} md={3} lg={2} key={i}>
              <Skeleton variant="rectangular" height={250} sx={{ borderRadius: 2 }} animation="wave" />
              <Skeleton variant="text" sx={{ mt: 1 }} animation="wave" />
            </Grid>
          ))}
        </Grid>
      ) : results.length > 0 ? (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {seoTitle}
          </Typography>
          <Grid container spacing={{ xs: 1.5, sm: 2 }}>
            {results.map((movie) => (
              <Grid item xs={6} sm={4} md={3} lg={2} key={movie._id}>
                <MovieCard movie={movie} cdn={cdn} />
              </Grid>
            ))}
          </Grid>
          {totalPages > 1 && (
            <Box mt={5} display="flex" justifyContent="center">
              <Pagination
                count={totalPages} page={currentPage} color="primary" size="large"
                onChange={(_, v) => {
                  handleSearch(v, queryKeyword);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              />
            </Box>
          )}
        </>
      ) : queryKeyword ? (
        <Box textAlign="center" mt={8}>
          <Typography color="text.secondary">Không tìm thấy kết quả cho "{queryKeyword}"</Typography>
        </Box>
      ) : null}
    </Container>
  );
}
