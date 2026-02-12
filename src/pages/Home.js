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
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation, EffectCoverflow } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import "swiper/css/effect-coverflow";

function BannerSection({ title, link, movies }) {
  return (
    <Paper elevation={2} sx={{ mb: 5, p: 2, borderRadius: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2, alignItems: "center" }}>
        <Typography variant="h5" sx={{ fontWeight: "bold", borderBottom: "3px solid #1976d2" }}>
          {title}
        </Typography>
        <Button component={Link} to={link} variant="outlined" size="small">
          Xem thêm
        </Button>
      </Box>

      <Swiper
        modules={[Autoplay, Pagination, Navigation, EffectCoverflow]}
        effect="coverflow"
        grabCursor={true}
        centeredSlides={true}
        slidesPerView={3}
        coverflowEffect={{
          rotate: 0,
          stretch: 0,
          depth: 100,
          modifier: 2,
          slideShadows: false
        }}
        autoplay={{ delay: 4000, disableOnInteraction: false }}
        pagination={{ clickable: true }}
        navigation
        loop
        breakpoints={{
          0: { slidesPerView: 1 },
          768: { slidesPerView: 3 }
        }}
        style={{ width: "100%", height: "70vh" }}
      >
        {movies.map(m => (
          <SwiperSlide key={m._id}>
            <Box sx={{ position: "relative", width: "100%", height: "100%" }}>
              <Box
                component="img"
                src={m.poster_url?.startsWith("http")
                  ? m.poster_url
                  : `https://phimimg.com/${m.poster_url}`}
                alt={m.name}
                sx={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  borderRadius: 3,
                  boxShadow: 6
                }}
                onError={(e) => { e.target.src = "/no-image.jpg"; }}
              />
              <Box
                sx={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  p: { xs: 2, md: 4 },
                  background: "linear-gradient(to top, rgba(0,0,0,0.6), transparent)"
                }}
              >
                <Typography variant="h6" color="white" fontWeight="bold">
                  {m.name}
                </Typography>
                <Typography variant="body2" color="white">
                  {m.year} • {m.quality}
                </Typography>
              </Box>
            </Box>
          </SwiperSlide>
        ))}
      </Swiper>
    </Paper>
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
      <BannerSection
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
