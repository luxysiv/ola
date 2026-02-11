// src/pages/Home.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Card,
  CardMedia,
  CardContent,
  Button
} from "@mui/material";

function HorizontalSection({ title, link, movies }) {
  return (
    <Box sx={{ mt: 4 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h5">{title}</Typography>
        <Button component={Link} to={link}>Xem thêm</Button>
      </Box>
      <Box sx={{ display: "flex", overflowX: "auto", gap: 2 }}>
        {movies.map(m => (
          <Card key={m._id} sx={{ minWidth: 160 }}>
            <Link to={`/movie/${m.slug}`}>
              <CardMedia
                component="img"
                height="220"
                image={m.poster_url?.startsWith("http")
                  ? m.poster_url
                  : `https://phimimg.com/${m.poster_url}`}
                onError={(e) => { e.target.src = "/no-image.jpg"; }}
              />
            </Link>
            <CardContent>
              <Typography variant="body2" noWrap>{m.name}</Typography>
              <Typography variant="caption" color="text.secondary">
                {m.year} • {m.quality}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
}

function Home() {
  const [latest, setLatest] = useState([]);
  const [hanhDong, setHanhDong] = useState([]);
  const [hanQuoc, setHanQuoc] = useState([]);
  const [phimBo, setPhimBo] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axios.get("https://phimapi.com/danh-sach/phim-moi-cap-nhat-v3?page=1"),
      axios.get("https://phimapi.com/v1/api/the-loai/hanh-dong?page=1"),
      axios.get("https://phimapi.com/v1/api/quoc-gia/han-quoc?page=1"),
      axios.get("https://phimapi.com/v1/api/danh-sach/phim-bo?page=1")
    ])
      .then(([latestRes, catRes, countryRes, typeRes]) => {
        setLatest(latestRes.data.items || []);
        setHanhDong(catRes.data.data.items || []);
        setHanQuoc(countryRes.data.data.items || []);
        setPhimBo(typeRes.data.data.items || []);
      })
      .catch(() => {
        setLatest([]);
        setHanhDong([]);
        setHanQuoc([]);
        setPhimBo([]);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Container sx={{ mt: 3, textAlign: "center" }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container sx={{ mt: 3 }}>
      <Typography variant="h4" gutterBottom>🎬 Hdophim - Trang chủ</Typography>

      <HorizontalSection
        title="🔥 Phim mới cập nhật"
        link="/phim-moi-cap-nhat"
        movies={latest}
      />

      <HorizontalSection
        title="🎯 Thể loại: Hành động"
        link="/the-loai/hanh-dong"
        movies={hanhDong}
      />

      <HorizontalSection
        title="🌏 Quốc gia: Hàn Quốc"
        link="/quoc-gia/han-quoc"
        movies={hanQuoc}
      />

      <HorizontalSection
        title="📺 Loại phim: Phim Bộ"
        link="/danh-sach/phim-bo"
        movies={phimBo}
      />
    </Container>
  );
}

export default Home;
