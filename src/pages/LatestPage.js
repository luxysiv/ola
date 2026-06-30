import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Container, Typography, Box, Pagination } from "@mui/material";
import WhatshotIcon from "@mui/icons-material/Whatshot";
import MovieCard from "../components/MovieCard";
import MovieGrid from "../components/MovieGrid";

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
      <Helmet><title>{`Phim Mới Cập Nhật – Trang ${currentPage} | Hdophim`}</title></Helmet>

      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
        <WhatshotIcon sx={{ color: "primary.main" }} />
        <Typography variant="h5" fontWeight={700}>Phim mới cập nhật</Typography>
        {currentPage > 1 && <Typography variant="body2" color="text.secondary">– Trang {currentPage}</Typography>}
      </Box>

      <MovieGrid loading={loading}>
        {movies.map((m) => (
          <MovieCard key={m._id} movie={m} to={`/phim/${m.slug}`} />
        ))}
      </MovieGrid>

      {!loading && totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={5}>
          <Pagination
            count={totalPages} page={currentPage}
            onChange={(_, v) => { navigate(`/phim-moi-cap-nhat?trang=${v}`); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            color="primary" size="large" showFirstButton showLastButton
          />
        </Box>
      )}
    </Container>
  );
}
