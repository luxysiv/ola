
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
import { Autoplay, Pagination, Navigation, EffectCoverflow } from "swiper/modules";

import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import "swiper/css/effect-coverflow";

import { getHistory } from "../utils/history";

/* ================= Helper ================= */

const normalize = (str = "") =>
  str
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[()#]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();

const getPosterUrl = (url) => {
  if (!url) return "/no-image.jpg";
  return url.startsWith("https://") ? url : `https://phimimg.com/${url}`;
};

/* ================= Skeleton ================= */

function MovieCardSkeleton() {
  return (
    <Card sx={{ width: 160 }}>
      <Skeleton variant="rectangular" sx={{ aspectRatio: "2 / 3" }} />
      <CardContent>
        <Skeleton />
        <Skeleton width="60%" />
      </CardContent>
    </Card>
  );
}

function BannerSkeleton() {
  return (
    <Paper sx={{ mb: 5, p: 2 }}>
      <Skeleton width={200} height={40} />
      <Skeleton variant="rectangular" sx={{ width: "100%", aspectRatio: "2 / 3" }} />
    </Paper>
  );
}

/* ================= Movie Card ================= */

function MovieCard({ movie, link }) {
  return (
    <Card
      sx={{
        width: { xs: 120, sm: 140, md: 160, lg: 180 },
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        transition: "0.25s",
        "&:hover": { transform: "scale(1.06)" }
      }}
    >
      <Link to={link} style={{ textDecoration: "none" }}>
        <Box sx={{ aspectRatio: "2 / 3", overflow: "hidden", borderRadius: 2 }}>
          <CardMedia
            component="img"
            image={getPosterUrl(movie.poster_url || movie.poster)}
            sx={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </Box>

        <CardContent
          sx={{
            height: 60,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            p: 1
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 600,
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical"
            }}
          >
            {movie.name}
          </Typography>

          <Typography variant="caption" color="text.secondary">
            {movie.year} • {movie.quality}
          </Typography>
        </CardContent>
      </Link>
    </Card>
  );
}

/* ================= Banner ================= */

function BannerSection({ title, link, movies }) {
  return (
    <Paper elevation={2} sx={{ mb: 5, p: 2 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2
        }}
      >
        <Typography variant="h5" fontWeight="bold">
          {title}
        </Typography>

        <Button component={Link} to={link} variant="outlined">
          Xem thêm
        </Button>
      </Box>

      <Swiper
        modules={[Autoplay, Pagination, Navigation, EffectCoverflow]}
        effect="coverflow"
        centeredSlides
        grabCursor
        loop
        autoplay={{ delay: 4000 }}
        pagination={{ clickable: true }}
        navigation
        coverflowEffect={{
          rotate: 0,
          depth: 140,
          modifier: 1.5,
          slideShadows: false
        }}
        breakpoints={{
          0: { slidesPerView: 1 },
          600: { slidesPerView: 1.5 },
          900: { slidesPerView: 2.2 },
          1200: { slidesPerView: 3 }
        }}
      >
        {movies.map((m) => (
          <SwiperSlide key={m._id}>
            <Link to={`/phim/${m.slug}`} style={{ textDecoration: "none" }}>
              <Box sx={{ maxWidth: 420, margin: "0 auto" }}>
                <Box
                  sx={{
                    aspectRatio: "2 / 3",
                    borderRadius: 3,
                    overflow: "hidden",
                    position: "relative"
                  }}
                >
                  <Box
                    component="img"
                    src={getPosterUrl(m.poster_url)}
                    sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />

                  <Box
                    sx={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      p: 2,
                      background:
                        "linear-gradient(to top, rgba(0,0,0,0.8), transparent)"
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
              </Box>
            </Link>
          </SwiperSlide>
        ))}
      </Swiper>
    </Paper>
  );
}

/* ================= Horizontal Section ================= */

function HorizontalSection({ title, link, movies, isHistory = false }) {
  return (
    <Paper elevation={2} sx={{ mt: 5, p: 2 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2
        }}
      >
        <Typography variant="h5" fontWeight="bold">
          {title}
        </Typography>

        <Button component={Link} to={link} variant="outlined">
          Xem thêm
        </Button>
      </Box>

      <Box
        sx={{
          display: "flex",
          gap: 2,
          overflowX: "auto",
          pb: 1,
          "&::-webkit-scrollbar": { display: "none" }
        }}
      >
        {movies.map((m, i) => {
          const movieLink = isHistory
            ? `/phim/${m.slug}?${normalize(m.server)}&${normalize(m.episode)}`
            : `/phim/${m.slug}`;

          return <MovieCard key={m._id || i} movie={m} link={movieLink} />;
        })}
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
        <BannerSkeleton />
        <MovieCardSkeleton />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 5, mb: 5 }}>
      <Helmet>
        <title>Hdophim - Xem phim trực tuyến miễn phí</title>
      </Helmet>

      <BannerSection
        title="Phim mới cập nhật"
        link="/phim-moi-cap-nhat"
        movies={latest}
      />

      {history.length > 0 && (
        <HorizontalSection
          title="Tiếp tục xem"
          link="/lich-su"
          movies={history}
          isHistory
        />
      )}

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
        title="Phim Bộ Mới"
        link="/danh-sach/phim-bo"
        movies={phimBo}
      />
    </Container>
  );
}

export default Home;
