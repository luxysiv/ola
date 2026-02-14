import React, { useState, useEffect } from "react";
import { Container, Typography, Grid, Card, CardMedia, CardContent, Button, Box, IconButton } from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';
import { Link } from "react-router-dom";

function HistoryPage() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("watch_history") || "[]");
    setHistory(saved);
  }, []);

  const clearAll = () => {
    if(window.confirm("Bạn có muốn xóa tất cả lịch sử?")) {
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" fontWeight="bold">Lịch sử xem phim</Typography>
        {history.length > 0 && (
          <Button variant="contained" color="error" startIcon={<DeleteIcon />} onClick={clearAll}>
            Xóa sạch
          </Button>
        )}
      </Box>

      {history.length === 0 ? (
        <Box sx={{ textAlign: 'center', mt: 10 }}>
          <Typography color="text.secondary">Bạn chưa xem phim nào.</Typography>
          <Button component={Link} to="/" sx={{ mt: 2 }}>Về trang chủ</Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {history.map((m) => (
            <Grid item xs={6} sm={4} md={3} lg={2} key={m.slug}>
              <Card sx={{ position: 'relative', height: '100%' }}>
                <IconButton 
                  size="small" 
                  sx={{ position: 'absolute', top: 5, right: 5, bgcolor: 'rgba(0,0,0,0.6)', color: 'white', '&:hover': {bgcolor: 'red'} }}
                  onClick={() => removeItem(m.slug)}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
                <Link to={`/phim/${m.slug}`}>
                  <CardMedia
                    component="img"
                    height="240"
                    image={m.poster?.startsWith("http") ? m.poster : `https://phimimg.com/${m.poster}`}
                    sx={{ objectFit: 'cover' }}
                  />
                </Link>
                <CardContent sx={{ p: 1.5 }}>
                  <Typography variant="subtitle2" noWrap fontWeight="bold">{m.name}</Typography>
                  <Typography variant="caption" color="primary" sx={{ display: 'block' }}>
                    {m.server} - Tập {m.episode}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(m.time).toLocaleDateString('vi-VN')}
                  </Typography>
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
