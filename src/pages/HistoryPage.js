// src/pages/HistoryPage.js
import React, { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Button
} from "@mui/material";
import { Link } from "react-router-dom";

import {
  getHistory,
  removeHistoryItem,
  clearHistory
} from "../utils/history";

const normalize = (str = "") =>
  str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[()#]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();

// chuẩn hóa URL poster
const getPosterUrl = (url) => {
  if (!url) return "/no-image.jpg";
  return url.startsWith("https://")
    ? url
    : `https://phimimg.com/${url}`;
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
    clearHistory();
    setHistory([]);
  };

  return (
    <Container sx={{ mt: 3 }}>
      <Typography variant="h5" gutterBottom>
        Lịch sử xem
      </Typography>

      {history.length > 0 && (
        <Button color="error" onClick={handleClear}>
          Xóa toàn bộ
        </Button>
      )}

      <Grid container spacing={2} sx={{ mt: 1 }}>
        {history.map((m) => (
          <Grid item xs={6} sm={4} md={3} key={m.slug}>
            <Card>
              <Link to={`/phim/${m.slug}?${normalize(m.server)}&${normalize(m.episode)}`}>
                <CardMedia
                  component="img"
                  height="240"
                  image={getPosterUrl(m.poster)}
                  onError={(e) => {
                    e.target.src = "/no-image.jpg";
                  }}
                />
              </Link>

              <CardContent>
                <Typography noWrap>
                  {m.name}
                </Typography>

                <Typography variant="caption">
                  {m.episode}
                </Typography>

                <Button
                  size="small"
                  color="error"
                  onClick={() => handleDelete(m.slug)}
                >
                  Xóa
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}

export default HistoryPage;
