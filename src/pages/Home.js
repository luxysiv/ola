import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
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

// --- Skeleton Loaders ---
function MovieCardSkeleton() {
  return (
    <Card sx={{ minWidth: 160, borderRadius: 2, p: 1, flex: "0 0 auto" }}>
      <Skeleton variant="rectangular" height={220} sx={{ borderRadius: 2 }} animation="wave" />
      <CardContent sx={{ textAlign: "center" }}>
        <Skeleton variant="text" width="80%" height={20} />
        <Skeleton variant="text" width="60%" height={15} />
      </CardContent>
    </Card>
  );
}

// --- Section Component ---
function HorizontalSection({ title, link, movies, isHistory = false }) {
  if (movies.length === 0) return null;
  return (
    <Paper elevation={2} sx={{ mt: 5, p: 2, borderRadius: 3, bgcolor: isHistory ? "#fafafa" : "white" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2, alignItems: "center" }}>
        <Typography variant="h5" sx={{ fontWeight: "bold", borderLeft: isHistory ? "5px solid #1976d2" : "none", pl: isHistory ? 2 : 0 }}>
          {title}
        </Typography>
        <Button component={Link} to={link} variant="outlined" size="small">
          {isHistory ? "Quản lý" : "Xem thêm"}
        </Button>
      </Box>

      <Box sx={{ display: "flex", overflowX: "auto", gap: 2, scrollBehavior: "smooth", pb: 1 }}>
        {movies.map((m) => (
          <Card
            key={m.slug || m._id}
            sx={{
              minWidth: 160,
              maxWidth: 160,
              transition: "transform 0.28s",
              "&:hover": { transform: "scale(1.05)" },
              flex: "0 0 auto"
            }}
          >
            {/* LƯU Ý: Nếu là lịch sử thì dùng fullPath, nếu không dùng slug mặc định */}
            <Link to={isHistory && m.fullPath ? m.fullPath : `/phim/${m.slug}`}>
              <CardMedia
                component="img"
                height="220"
                image={m.poster_url?.startsWith("http") ? m.poster_url : (m.poster?.startsWith("http") ? m.poster : `https://phimimg.com/${m.poster_url || m.poster}`)}
                onError={(e) => { e.target.src = "/no-image.jpg"; }}
                sx={{ borderRadius: 2 }}
              />
            </Link>
            <CardContent sx={{ textAlign: "center", p: 1 }}>
              <Typography variant="subtitle2" noWrap fontWeight="bold">
                {m.name}
              </Typography>
              <Typography variant="caption" color="primary">
                {isHistory ? `Tập: ${m.episode}` : `${m.year} • ${m.quality}`}
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
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Lấy lịch sử xem từ localStorage
    const savedHistory = JSON.parse(localStorage.getItem("watch_history") || "[]");
    setHistory(savedHistory);

    Promise.all([
      axios.get("https://phimapi.com/danh-sach/phim-moi-cap-nhat-v3?page=1"),
      axios.get("https://phimapi.com/v1/api/the-loai/hanh-dong?page=1"),
      axios.get("https://phimapi.com/v1/api/quoc-gia/han-quoc?page=1")
    ])
      .then(([latestRes, catRes, countryRes]) => {
        setLatest(latestRes.data.items || []);
        setHanhDong(catRes.data.data.items || []);
        setHanQuoc(countryRes.data.data.items || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 5 }}>
        <Skeleton variant="rectangular" width="100%" height="50vh" sx={{ mb: 4, borderRadius: 3 }} />
        <Box sx={{ display: "flex", gap: 2 }}>{[...Array(4)].map((_, i) => <MovieCardSkeleton key={i} />)}</Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 5 }}>
      {/* 1. Dòng lịch sử (Chỉ hiện khi có dữ liệu) */}
      <HorizontalSection title="Tiếp tục xem" link="/lich-su" movies={history} isHistory={true} />

      {/* 2. Banner Phim mới (Tối giản lại so với bản gốc của bạn) */}
      <Typography variant="h5" sx={{ fontWeight: "bold", mb: 2, mt: 4 }}>Phim mới cập nhật</Typography>
      <Swiper
        modules={[Autoplay, Pagination, Navigation]}
        spaceBetween={20}
        slidesPerView={1}
        autoplay={{ delay: 5000 }}
        pagination={{ clickable: true }}
        navigation
        breakpoints={{ 900: { slidesPerView: 2 } }}
        style={{ borderRadius: "15px", height: "400px" }}
      >
        {latest.slice(0, 10).map((m) => (
          <SwiperSlide key={m._id}>
            <Link to={`/phim/${m.slug}`}>
              <Box sx={{ position: "relative", height: "100%" }}>
                <Box component="img" src={m.poster_url} sx={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 3 }} />
                <Box sx={{ position: "absolute", bottom: 0, p: 3, width: "100%", background: "linear-gradient(transparent, rgba(0,0,0,0.9))" }}>
                  <Typography variant="h6" color="white">{m.name}</Typography>
                </Box>
              </Box>
            </Link>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* 3. Các thể loại khác */}
      <HorizontalSection title="Hành động" link="/the-loai/hanh-dong" movies={hanhDong} />
      <HorizontalSection title="Hàn Quốc" link="/quoc-gia/han-quoc" movies={hanQuoc} />
    </Container>
  );
}

export default Home;
