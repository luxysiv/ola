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
  Divider,
  Tooltip
} from "@mui/material";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

import {
  getHistory,
  removeHistoryItem,
  clearHistory
} from "../utils/history";

// Hàm chuẩn hóa URL
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

  // Load lịch sử khi vào trang
  const loadHistory = () => {
    const data = getHistory();
    setHistory(data);
  };

  useEffect(() => {
    loadHistory();
  }, []);

  // Xóa một mục phim (Xóa dựa trên slug và episode để khớp với logic filter mới)
  const handleDelete = (slug, episode) => {
    removeHistoryItem(slug, episode);
    loadHistory(); // Reload lại state sau khi xóa
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
        <Typography variant="h5" sx={{ fontWeight: "bold", color: "primary.main" }}>
          🕒 LỊCH SỬ XEM
        </Typography>
        
        {history.length > 0 && (
          <Button 
            variant="contained" 
            color="error" 
            startIcon={<DeleteSweepIcon />}
            onClick={handleClear}
            size="small"
            sx={{ borderRadius: 2 }}
          >
            Xóa toàn bộ
          </Button>
        )}
      </Box>

      <Divider sx={{ mb: 3 }} />

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
        <Grid container spacing={2}>
          {history.map((m, index) => (
            <Grid item xs={6} sm={4} md={3} lg={2.4} key={`${m.slug}-${m.episode}-${index}`}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  transition: "all 0.3s ease-in-out",
                  borderRadius: 2,
                  "&:hover": { 
                    transform: "translateY(-5px)", 
                    boxShadow: "0 10px 20px rgba(0,0,0,0.2)" 
                  }
                }}
              >
                {/* Nút Xóa nhanh ở góc */}
                <Tooltip title="Xóa mục này">
                  <Button
                    onClick={() => handleDelete(m.slug, m.episode)}
                    sx={{
                      position: 'absolute',
                      top: 5,
                      right: 5,
                      minWidth: 35,
                      height: 35,
                      borderRadius: '50%',
                      bgcolor: 'rgba(0,0,0,0.5)',
                      color: 'white',
                      zIndex: 2,
                      '&:hover': { bgcolor: 'error.main' }
                    }}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </Button>
                </Tooltip>

                <Link 
                  to={`/phim/${m.slug}?${normalize(m.server)}&${normalize(m.episode)}`} 
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <Box sx={{ position: 'relative', overflow: 'hidden' }}>
                    <CardMedia
                      component="img"
                      height="260"
                      image={getPosterUrl(m.poster)}
                      alt={m.name}
                      sx={{ 
                        objectFit: 'cover',
                        borderTopLeftRadius: 8,
                        borderTopRightRadius: 8
                      }}
                      onError={(e) => { e.target.src = "/no-image.jpg"; }}
                    />
                    <Box 
                      sx={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        bgcolor: 'primary.main',
                        color: 'white',
                        p: 0.5,
                        textAlign: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 'bold'
                      }}
                    >
                      Tập: {m.episode}
                    </Box>
                  </Box>

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
                        lineHeight: 1.2
                      }}
                    >
                      {m.name}
                    </Typography>
                    
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                      {new Date(m.updatedAt).toLocaleDateString('vi-VN')}
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
