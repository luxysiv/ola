import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  Container, TextField, Button, Typography,
  Pagination, Autocomplete, Box, InputAdornment
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import MovieCard from "../components/MovieCard";
import MovieGrid from "../components/MovieGrid";

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
      <Helmet><title>{seoTitle} | Hdophim</title></Helmet>

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

      {loading ? (
        <MovieGrid loading />
      ) : results.length > 0 ? (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{seoTitle}</Typography>
          <MovieGrid loading={false}>
            {results.map((movie) => (
              <MovieCard key={movie._id} movie={movie} to={`/phim/${movie.slug}`} cdn={cdn} />
            ))}
          </MovieGrid>
          {totalPages > 1 && (
            <Box mt={5} display="flex" justifyContent="center">
              <Pagination
                count={totalPages} page={currentPage} color="primary" size="large"
                onChange={(_, v) => { handleSearch(v, queryKeyword); window.scrollTo({ top: 0, behavior: "smooth" }); }}
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
