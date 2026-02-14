import React, { useState, useEffect } from "react";
import { 
  Container, 
  Typography, 
  Grid, 
  Card, 
  CardMedia, 
  CardContent, 
  Button, 
  Box, 
  IconButton,
  Divider
} from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { Link } from "react-router-dom";

function HistoryPage() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    // Lấy dữ liệu đã lưu từ localStorage
    const saved = JSON.parse(localStorage.getItem("watch_history") || "[]");
    setHistory(saved);
  }, []);

  const clearAll = () => {
    if (window.confirm("Bạn có muốn xóa tất cả lịch sử xem phim không?")) {
      localStorage.removeItem("watch_history");
      setHistory([]);
    }
  };

  const removeItem = (slug) => {
    const updated = history.filter(item => item.slug !== slug);
    localStorage.setItem("watch_history", JSON.stringify(updated));
    setHistory(updated);
  };

  return (
    <Container sx={{ mt: 5, mb: 5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" sx={{ color: '#1976d2' }}>
          Lịch sử xem phim
        </Typography>
        {history.length > 0 && (
          <Button 
            variant="outlined" 
            color="error" 
            startIcon={<DeleteIcon />} 
            onClick={clearAll}
          >
            Xóa tất cả
          </Button>
        )}
      </Box>
      <Divider sx={{ mb: 4 }} />

      {history.length === 0 ? (
        <Box sx={{ textAlign: 'center', mt: 10 }}>
          <Typography variant="h6" color="text.secondary">
            Bạn chưa xem phim nào gần đây.
          </Typography>
          <Button 
            component={Link} 
            to="/" 
            variant="contained" 
            sx={{ mt: 2, borderRadius: 5 }}
          >
            Khám phá phim ngay
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {history.map((m) => (
            <Grid item xs={6} sm={4} md={3} lg={2.4} key={m.slug}>
              <Card 
                sx={{ 
                  position: 'relative', 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'scale(1.02)', boxShadow: 10 }
                }}
              >
                {/* Nút xóa từng mục */}
                <IconButton 
                  size="small" 
                  sx={{ 
                    position: 'absolute', 
                    top: 8, 
                    right: 8, 
                    bgcolor: 'rgba(0,0,0,0.6)', 
                    color: 'white', 
                    zIndex: 2,
                    '&:hover': { bgcolor: 'red' } 
                  }}
                  onClick={() => removeItem(m.slug)}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>

                {/* THAY ĐỔI QUAN TRỌNG: Link dùng fullPath để nhảy vào đúng tập */}
                <Link to={m.fullPath || `/phim/${m.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <Box sx={{ position: 'relative' }}>
                    <CardMedia
                      component="img"
                      height="280"
                      image={m.poster?.startsWith("http") ? m.poster : `https://phimimg.com/${m.poster}`}
                      alt={m.name}
                      sx={{ objectFit: 'cover' }}
                      onError={(e) => { e.target.src = "/no-image.jpg"; }}
                    />
                    <Box sx={{ 
                      position: 'absolute', 
                      inset: 0, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      bgcolor: 'rgba(0,0,0,0.2)',
                      opacity: 0,
                      '&:hover': { opacity: 1 },
                      transition: '0.3s'
                    }}>
                      <PlayArrowIcon sx={{ fontSize: 60, color: 'white' }} />
                    </Box>
                  </Box>

                  <CardContent sx={{ flexGrow: 1, p: 1.5 }}>
                    <Typography variant="subtitle2" noWrap fontWeight="bold" title={m.name}>
                      {m.name}
                    </Typography>
                    <Typography variant="caption" color="primary" sx={{ display: 'flex', alignItems: 'center', mt: 0.5, fontWeight: 'bold' }}>
                      {m.server} • Tập {m.episode}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      Xem lúc: {new Date(m.time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - {new Date(m.time).toLocaleDateString('vi-VN')}
                    </Typography>
                  </CardContent>
                </Link>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}

export default HistoryPage;
