import React, { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Button,
  Box,
  Divider
} from "@mui/material";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';

import {
  getHistory,
  removeHistoryItem,
  clearHistory
} from "../utils/history";

// Hàm chuẩn hóa URL để khớp với tập đang xem
const normalize = (str = "") =>
  str.toString().toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d").replace(/[()#]/g, "")
    .replace(/\s+/g, "-").replace(/-+/g, "-").trim();

const getPosterUrl = (url) => {
  if (!url) return "/no-image.jpg";
  return url.startsWith("http") ? url : `https://phimimg.com/${url}`;
};

function HistoryPage() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  const handleDelete = (slug) => {
    removeHistoryItem(slug);
    setHistory(getHistory());
  };

  const handleClear = () => {
    if (window.confirm("Bạn có chắc chắn muốn xóa toàn bộ lịch sử xem không?")) {
      clearHistory();
      setHistory([]);
    }
  };

  return (
    <Container sx={{ mt: 3, mb: 5 }}>
      <Helmet>
        <title>Lịch sử xem phim | KKPhim</title>
      </Helmet>

      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: "bold" }}>
          🕒 Lịch sử xem của bạn
        </Typography>
        
        {history.length > 0 && (
          <Button 
            variant="outlined" 
            color="error" 
            startIcon={<DeleteSweepIcon />}
            onClick={handleClear}
            size="small"
          >
            Xóa toàn bộ
          </Button>
        )}
      </Box>

      <Divider sx={{ mb: 3 }} />

      {history.length === 0 ? (
        <Box sx={{ textAlign: 'center', mt: 10 }}>
          <Typography color="text.secondary">Bạn chưa xem phim nào gần đây.</Typography>
          <Button component={Link} to="/" sx={{ mt: 2 }}>Khám phá ngay</Button>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {history.map((m) => (
            <Grid item xs={6} sm={4} md={3} lg={2.4} key={m.slug}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: "transform 0.3s",
                  "&:hover": { transform: "scale(1.03)", boxShadow: 6 }
                }}
              >
                <Link 
                  to={`/phim/${m.slug}?${normalize(m.server)}&${normalize(m.episode)}`} 
                  style={{ textDecoration: 'none' }}
                >
                  <Box sx={{ position: 'relative' }}>
                    <CardMedia
                      component="img"
                      height="280"
                      image={getPosterUrl(m.poster)}
                      alt={m.name}
                      sx={{ objectFit: 'cover' }}
                      onError={(e) => { e.target.src = "/no-image.jpg"; }}
                    />
                    {/* Badge hiển thị tập đang xem dở */}
                    <Box 
                      sx={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        bgcolor: 'rgba(0,0,0,0.7)',
                        color: 'white',
                        p: 0.5,
                        textAlign: 'center',
                        fontSize: '0.75rem'
                      }}
                    >
                      Đang xem: {m.episode}
                    </Box>
                  </Box>
                </Link>

                <CardContent sx={{ flexGrow: 1, p: 1.5 }}>
                  <Typography 
                    variant="subtitle2" 
                    sx={{ 
                      fontWeight: 'bold', 
                      height: 40, 
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      color: 'text.primary',
                      mb: 1
                    }}
                  >
                    {m.name}
                  </Typography>

                  <Button
                    fullWidth
                    variant="text"
                    size="small"
                    color="error"
                    onClick={() => handleDelete(m.slug)}
                    sx={{ fontSize: '0.7rem' }}
                  >
                    Xóa khỏi lịch sử
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}

export default HistoryPage;
