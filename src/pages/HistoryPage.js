import React, { useState, useEffect } from "react";
import { Container, Typography, Grid, Card, CardMedia, CardContent, Button } from "@mui/material";
import { Link } from "react-router-dom";

function HistoryPage() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const h = JSON.parse(localStorage.getItem("watchHistory") || "[]");
    setHistory(h);
  }, []);

  const clearHistory = () => {
    localStorage.removeItem("watchHistory");
    setHistory([]);
  };

  return (
    <Container sx={{ mt: 3 }}>
      <Typography variant="h5" gutterBottom>Lịch sử xem phim</Typography>
      {history.length === 0 ? (
        <Typography>Chưa có lịch sử xem.</Typography>
      ) : (
        <>
          <Grid container spacing={2}>
            {history.map((h, i) => (
              <Grid item xs={6} sm={4} md={3} key={i}>
                <Card>
                  <Link to={`/phim/${h.slug}?${h.server}&${h.episode}`}>
                    <CardMedia
                      component="img"
                      height="220"
                      image={h.poster?.startsWith("http") ? h.poster : `https://phimimg.com/${h.poster}`}
                    />
                  </Link>
                  <CardContent>
                    <Typography variant="subtitle2">{h.name}</Typography>
                    <Typography variant="caption">Tập: {h.episode}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          <Button onClick={clearHistory} sx={{ mt: 2 }} variant="outlined">Xóa lịch sử</Button>
        </>
      )}
    </Container>
  );
}

export default HistoryPage;
