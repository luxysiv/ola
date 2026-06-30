import React, { useEffect, useState } from "react";
import { Container, Typography, Box, Button, Divider } from "@mui/material";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import HistoryIcon from "@mui/icons-material/History";
import { getHistory, removeHistoryItem, clearHistory } from "../utils/history";
import MovieCard from "../components/MovieCard";
import MovieGrid from "../components/MovieGrid";

const normalize = (str = "") =>
  str.toString().toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d").replace(/[()#]/g, "")
    .replace(/\s+/g, "-").replace(/-+/g, "-").trim();

function HistoryPage() {
  const [history, setHistory] = useState([]);

  const loadHistory = () => setHistory(getHistory());
  useEffect(() => { loadHistory(); }, []);

  const handleDelete = (slug, episode) => {
    removeHistoryItem(slug, episode);
    loadHistory();
  };

  const handleClear = () => {
    if (window.confirm("Bạn có chắc chắn muốn xóa toàn bộ lịch sử xem không?")) {
      clearHistory();
      setHistory([]);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ pt: 4, pb: 6 }}>
      <Helmet><title>Lịch sử xem phim</title></Helmet>

      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <HistoryIcon sx={{ color: "primary.main" }} />
          <Typography variant="h5" fontWeight={700}>Lịch sử xem</Typography>
        </Box>
        {history.length > 0 && (
          <Button
            variant="outlined" color="error" startIcon={<DeleteSweepIcon />}
            onClick={handleClear} size="small" sx={{ borderRadius: 2 }}
          >
            Xóa toàn bộ
          </Button>
        )}
      </Box>
      <Divider sx={{ mb: 3 }} />

      {history.length === 0 ? (
        <Box sx={{ textAlign: "center", mt: 8 }}>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Bạn chưa xem phim nào gần đây.
          </Typography>
          <Button component={Link} to="/" variant="contained" sx={{ borderRadius: 5, fontWeight: 700 }}>
            Khám phá phim ngay
          </Button>
        </Box>
      ) : (
        <MovieGrid loading={false}>
          {history.map((m, index) => (
            <MovieCard
              key={`${m.slug}-${m.episode}-${index}`}
              movie={m}
              to={`/phim/${m.slug}?${normalize(m.server)}&${normalize(m.episode)}`}
              episodeLabel={`Đang xem: ${m.episode}`}
              bottomBadge={m.episode}
              onDelete={() => handleDelete(m.slug, m.episode)}
            />
          ))}
        </MovieGrid>
      )}
    </Container>
  );
}

export default HistoryPage;
