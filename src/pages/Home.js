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
  Button,
  Paper
} from "@mui/material";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

function BannerSection({ movies }) {
  const settings = {
    dots: true,
    infinite: true,
    speed: 600,
    slidesToShow: 1,
    slidesToScroll: 1,
    centerMode: true,
    centerPadding: "120px",
    autoplay: true,
    autoplaySpeed: 4000,
    responsive: [
      {
        breakpoint: 768, // tablet trở xuống
        settings: {
          centerMode: false,
          centerPadding: "0px",
          slidesToShow: 1
        }
      }
    ]
  };

  return (
    <Box sx={{ mb: 5 }}>
      <Slider {...settings}>
        {movies.map(m => (
          <Box key={m._id} sx={{ position: "relative", px: 2 }}>
            <Link to={`/phim/${m.slug}`}>
              <Box
                component="img"
                src={m.poster_url?.startsWith("http")
                  ? m.poster_url
                  : `https://phimimg.com/${m.poster_url}`}
                alt={m.name}
                sx={{
                  width: "100%",
                  height: { xs: 220, sm: 300, md: 400 },
                  objectFit: "cover",
                  borderRadius: 3,
                  boxShadow: 4
                }}
                onError={(e) => { e.target.src = "/no-image.jpg"; }}
              />
              <Box
                sx={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  p: { xs: 1.5, md: 3 },
                  background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)",
                  borderRadius: "0 0 12px 12px"
                }}
              >
                <Typography 
                  variant={{ xs: "h6", md: "h5" }} 
                  color="white" 
                  fontWeight="bold"
                >
                  {m.name}
                </Typography>
                <Typography variant="body2" color="white">
                  {m.year} • {m.quality}
                </Typography>
              </Box>
            </Link>
          </Box>
        ))}
      </Slider>
    </Box>
  );
}

function HorizontalSection({ title, link, movies }) {
  return (
    <Paper elevation={2} sx={{ mt: 5, p: 2, borderRadius: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2, alignItems: "center" }}>
        <Typography variant="h5" sx={{ fontWeight: "bold", borderBottom: "3px solid #1976d2" }}>
          {title}
        </Typography>
        <Button component={Link} to={link} variant="outlined" size="small">
          Xem thêm
        </Button>
      </Box>
      <Box sx={{ display: "flex", overflowX: "auto", gap: 2, scrollBehavior: "smooth", pb: 1 }}>
        {movies.map(m => (
          <Card
            key={m._id}
            sx={{
              minWidth: 160,
              transition: "transform 0.3s, box-shadow 0.3s",
              "&:hover": { transform: "scale(1.05)", boxShadow: 6 }
            }}
          >
            <Link to={`/phim/${m.slug}`}>
              <CardMedia
                component="img"
                height="220"
                image={m.poster_url?.startsWith("http")
                  ? m.poster_url
                  : `https://phimimg.com/${m.poster_url}`}
                onError={(e) => { e.target.src = "/no-image.jpg"; }}
                sx={{ borderRadius: 2 }}
              />
            </Link>
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="subtitle2" noWrap fontWeight="bold">
                {m.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {m.year} • {m.quality}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Paper>
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
      <Container maxWidth="lg" sx={{ mt: 5, textAlign: "center" }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>Đang tải phim...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 5 }}>
      {/* Banner carousel cho phim mới cập nhật */}
      <BannerSection movies={latest} />

      <HorizontalSection
        title="Hành động"
        link="/the-loai/hanh-dong"
        movies={hanhDong}
      />

      <HorizontalSection
        title="Hàn Quốc"
        link="/quoc-gia/han-quoc"
        movies={hanQuoc}
      />

      <HorizontalSection
        title="Phim Bộ"
        link="/danh-sach/phim-bo"
        movies={phimBo}
      />
    </Container>
  );
}

export default Home;
