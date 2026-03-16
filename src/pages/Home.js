import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";

import {
  Container,
  Typography,
  Box,
  Card,
  CardMedia,
  CardContent,
  Button,
  Paper,
  Skeleton
} from "@mui/material";

import { Swiper, SwiperSlide } from "swiper/react";
import {
  Autoplay,
  Pagination,
  Navigation,
  EffectCoverflow
} from "swiper/modules";

import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import "swiper/css/effect-coverflow";

import { getHistory } from "../utils/history";

/* ================= Poster helper ================= */

const getPosterUrl = (url) => {
  if (!url) return "/no-image.jpg";
  return url.startsWith("https://")
    ? url
    : `https://phimimg.com/${url}`;
};

/* ================= Skeleton ================= */

function MovieCardSkeleton() {
  return (
    <Card sx={{ minWidth: 160 }}>
      <Skeleton variant="rectangular" height={220} />
      <CardContent>
        <Skeleton width="80%" />
        <Skeleton width="60%" />
      </CardContent>
    </Card>
  );
}

function HorizontalSkeleton() {
  return (
    <Paper sx={{ mt: 4, p: 2 }}>
      <Box sx={{ display: "flex", gap: 2 }}>
        {[...Array(6)].map((_, i) => (
          <MovieCardSkeleton key={i} />
        ))}
      </Box>
    </Paper>
  );
}

/* ================= Banner Section ================= */

function BannerSection({ title, link, movies }) {
  return (
    <Paper sx={{ mb: 4, p: 2, borderRadius: 3 }}>

      <Box sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        mb: 2
      }}>

        <Typography variant="h5" sx={{ fontWeight: "bold" }}>
          {title}
        </Typography>

        <Button
          component={Link}
          to={link}
          variant="outlined"
          size="small"
        >
          Xem thêm
        </Button>

      </Box>

      <Swiper
        modules={[Autoplay, Pagination, Navigation, EffectCoverflow]}
        effect="coverflow"
        grabCursor
        centeredSlides
        slidesPerView={3}
        autoplay={{ delay: 4000 }}
        pagination={{ clickable: true }}
        navigation
        loop
        breakpoints={{
          0: { slidesPerView: 1 },
          600: { slidesPerView: 1.2 },
          900: { slidesPerView: 2.2 },
          1200: { slidesPerView: 3 }
        }}
        style={{ height: "60vh" }}
      >

        {movies.map((m) => (
          <SwiperSlide key={m._id}>

            <Link to={`/phim/${m.slug}`}>

              <Box sx={{
                position: "relative",
                height: "100%"
              }}>

                <img
                  src={getPosterUrl(m.poster_url)}
                  alt={m.name}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: "12px"
                  }}
                />

                <Box sx={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  p: 3,
                  background:
                    "linear-gradient(to top, rgba(0,0,0,0.8), transparent)"
                }}>

                  <Typography
                    variant="h6"
                    sx={{ color: "#fff", fontWeight: "bold" }}
                  >
                    {m.name}
                  </Typography>

                  <Typography sx={{ color: "#ddd", fontSize: 13 }}>
                    {m.year} • {m.quality}
                  </Typography>

                </Box>

              </Box>

            </Link>

          </SwiperSlide>
        ))}

      </Swiper>

    </Paper>
  );
}

/* ================= Horizontal Section ================= */

function HorizontalSection({ title, link, movies }) {
  return (
    <Paper sx={{ mt: 4, p: 2, borderRadius: 3 }}>

      <Box sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        mb: 2
      }}>

        <Typography variant="h5" sx={{ fontWeight: "bold" }}>
          {title}
        </Typography>

        <Button
          component={Link}
          to={link}
          variant="outlined"
          size="small"
        >
          Xem thêm
        </Button>

      </Box>

      <Box
        className="scrollbar-hide"
        style={{
          display: "flex",
          overflowX: "auto",
          gap: 16,
          paddingBottom: 8
        }}
      >

        {movies.map((m, i) => (
          <Card
            key={m._id || i}
            sx={{
              minWidth: 160,
              flex: "0 0 auto",
              transition: "0.3s",
              "&:hover": {
                transform: "scale(1.05)"
              }
            }}
          >

            <Link to={`/phim/${m.slug}`}>

              <CardMedia
                component="img"
                height="220"
                image={getPosterUrl(m.poster_url)}
                onError={(e) =>
                  (e.target.src = "/no-image.jpg")
                }
              />

            </Link>

            <CardContent sx={{ textAlign: "center", p: 1 }}>

              <Typography
                variant="subtitle2"
                noWrap
                sx={{ fontWeight: "bold" }}
              >
                {m.name}
              </Typography>

              <Typography
                variant="caption"
                color="text.secondary"
              >
                {m.year} • {m.quality}
              </Typography>

            </CardContent>

          </Card>
        ))}

      </Box>

    </Paper>
  );
}

/* ================= Home ================= */

function Home() {

  const [latest, setLatest] = useState([]);
  const [hanhDong, setHanhDong] = useState([]);
  const [hanQuoc, setHanQuoc] = useState([]);
  const [phimBo, setPhimBo] = useState([]);
  const [history, setHistory] = useState([]);

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
      .finally(() => setLoading(false));

    setHistory(getHistory());

  }, []);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 5 }}>
        <HorizontalSkeleton />
      </Container>
    );
  }

  return (

    <Container
      maxWidth="lg"
      sx={{ mt: 5, mb: 5 }}
      className="px-4"
    >

      <Helmet>
        <title>Hdophim - Xem phim miễn phí</title>
      </Helmet>

      <BannerSection
        title="Phim mới cập nhật"
        link="/phim-moi-cap-nhat"
        movies={latest}
      />

      <HorizontalSection
        title="Phim Hành Động"
        link="/the-loai/hanh-dong"
        movies={hanhDong}
      />

      <HorizontalSection
        title="Phim Hàn Quốc"
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
