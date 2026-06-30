import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Container, Typography, Box, Pagination } from "@mui/material";
import MovieCard from "../components/MovieCard";
import MovieGrid from "../components/MovieGrid";

function YearPage() {
  const { year } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const currentPage = parseInt(searchParams.get("trang") || "1", 10);
  const [seoData, setSeoData] = useState({ descriptionHead: "", titlePage: "" });

  const handleFetch = useCallback(async (pageNum) => {
    if (!year) return;
    setLoading(true);
    try {
      const res = await axios.get(`https://phimapi.com/v1/api/nam/${year}?page=${pageNum}`);
      const data = res.data.data;
      setMovies(data.items || []);
      setTotalPages(data.params?.pagination?.totalPages || 1);
      setSeoData({ descriptionHead: data.seoOnPage?.descriptionHead || "", titlePage: data.titlePage || "" });
    } catch (error) {
      console.error("Lỗi fetch API Năm:", error);
      setMovies([]);
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => { handleFetch(currentPage); }, [currentPage, handleFetch]);

  const handlePageChange = (event, value) => {
    navigate(`/nam/${year}?trang=${value}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <Container maxWidth="lg" sx={{ pt: 4, pb: 6 }}>
      <Helmet>
        <title>{`${seoData.titlePage || "Năm " + year} - Trang ${currentPage}`}</title>
        <meta name="description" content={seoData.descriptionHead} />
      </Helmet>

      <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>
        {seoData.titlePage || `Năm ${year}`}
        {currentPage > 1 && <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>– Trang {currentPage}</Typography>}
      </Typography>

      <MovieGrid loading={loading}>
        {movies.map((m) => (
          <MovieCard key={m._id} movie={m} to={`/phim/${m.slug}`} />
        ))}
      </MovieGrid>

      {!loading && totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={5}>
          <Pagination count={totalPages} page={currentPage} onChange={handlePageChange} color="primary" size="large" showFirstButton showLastButton />
        </Box>
      )}
    </Container>
  );
}

export default YearPage;
