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

const normalize = (str = "") =>
  str.toString().toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d").replace(/[()#]/g, "")
    .replace(/\s+/g, "-").replace(/-+/g, "-").trim();

/* ================= Poster helper ================= */

const getPosterUrl = (url) => {
  if (!url) return "/no-image.jpg";
  return url.startsWith("https://")
    ? url
    : `https://phimimg.com/${url}`;
};

/* ================= Skeleton Components ================= */

function MovieCardSkeleton() {
  return (
    <Card sx={{ minWidth: 160, borderRadius: 2, boxShadow: 2, p: 1 }}>
      <Skeleton variant="rectangular" height={220} sx={{ borderRadius: 2 }} animation="wave" />
      <CardContent sx={{ textAlign: "center" }}>
        <Skeleton variant="text" width="80%" height={20} animation="wave" />
        <Skeleton variant="text" width="60%" height={15} animation="wave" />
      </CardContent>
    </Card>
  );
}

function BannerSkeleton() {
  return (
    <Paper elevation={2} sx={{ mb: 5, p: 2, borderRadius: 3 }}>
      <Skeleton variant="rectangular" width="100%" height="70vh" sx={{ borderRadius: 3 }} animation="wave" />
    </Paper>
  );
}

function HorizontalSkeleton() {
  return (
    <Paper elevation={2} sx={{ mt: 5, p: 2, borderRadius: 3 }}>
      <Box sx={{ display: "flex", gap: 2 }}>
        {[...Array(6)].map((_, i) => <MovieCardSkeleton key={i} />)}
      </Box>
    </Paper>
  );
}

/* ================= Banner Section ================= */

function BannerSection({ title, link, movies }) {
  return (
    <Paper elevation={2} className="mb-10 p-3 rounded-2xl bg-zinc-900">

      <Box className="flex justify-between items-center mb-4">
        <Typography variant="h5" className="font-bold text-white border-b-2 border-blue-500 pb-1">
          {title}
        </Typography>

        <Button component={Link} to={link} variant="outlined" size="small">
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
        style={{ height: "70vh" }}
      >
        {movies.map((m) => (
          <SwiperSlide key={m._id}>
            <Link to={`/phim/${m.slug}`}>

              <Box className="relative group h-full overflow-hidden rounded-2xl">

                <img
                  src={getPosterUrl(m.poster_url)}
                  alt={m.name}
                  className="w-full h-full object-cover transition duration-500 group-hover:scale-110"
                />

                <Box className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 to-transparent">

                  <Typography className="text-white font-bold text-lg" noWrap>
                    {m.name}
                  </Typography>

                  <Typography className="text-gray-300 text-sm">
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

function HorizontalSection({ title, link, movies, isHistory = false }) {

  return (
    <Paper elevation={2} className="mt-10 p-3 rounded-2xl bg-zinc-900">

      <Box className="flex justify-between items-center mb-4">

        <Typography variant="h5" className="font-bold text-white border-b-2 border-blue-500 pb-1">
          {title}
        </Typography>

        <Button component={Link} to={link} variant="outlined" size="small">
          Xem thêm
        </Button>

      </Box>

      <Box className="flex overflow-x-auto gap-4 scrollbar-hide pb-2">

        {movies.map((m, i) => {

          const movieLink = isHistory
            ? `/phim/${m.slug}?${normalize(m.server)}&${normalize(m.episode)}`
            : `/phim/${m.slug}`;

          return (
            <Card
              key={m._id || i}
              className="group min-w-[160px] hover:scale-105 transition duration-300 cursor-pointer"
            >

              <Link to={movieLink}>

                <CardMedia
                  component="img"
                  height="220"
                  image={getPosterUrl(m.poster_url || m.poster)}
                  onError={(e) => (e.target.src = "/no-image.jpg")}
                  className="rounded-xl transition duration-300 group-hover:brightness-110"
                />

              </Link>

              <CardContent className="text-center p-2">

                <Typography variant="subtitle2" noWrap className="font-bold">
                  {m.name}
                </Typography>

                {isHistory ? (
                  <Typography variant="caption" color="primary">
                    Đang xem: {m.episode}
                  </Typography>
                ) : (
                  <Typography variant="caption" color="text.secondary">
                    {m.year} • {m.quality}
                  </Typography>
                )}

              </CardContent>

            </Card>
          );
        })}

      </Box>

    </Paper>
  );
}

/* ================= Home Component ================= */

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
      <Container maxWidth="lg" className="mt-10">
        <BannerSkeleton />
        <HorizontalSkeleton />
      </Container>
    );
  }

  return (

    <Container maxWidth="lg" className="mt-10 mb-10 px-4 md:px-6 text-white">

      <Helmet>
        <title>Hdophim - Xem phim trực tuyến miễn phí Full HD</title>
        <meta
          name="description"
          content="Trang chủ phim mới cập nhật, phim hành động, phim bộ chất lượng cao Vietsub."
        />
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
          isHistory={true}
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
