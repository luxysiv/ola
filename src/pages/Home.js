import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Container, Typography, Box, Button, Grid, Skeleton } from "@mui/material";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation, EffectFade } from "swiper/modules";

// Import styles & Components
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import "swiper/css/effect-fade";
import MovieCard from "../components/MovieCard"; // Import hàng "xịn" vừa tách
import { getHistory } from "../utils/history";

function Home() {
  const [data, setData] = useState({ latest: [], hanhDong: [], hanQuoc: [], phimBo: [], history: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [latest, hanhDong, hanQuoc, phimBo] = await Promise.all([
          axios.get("https://phimapi.com/danh-sach/phim-moi-cap-nhat-v3?page=1"),
          axios.get("https://phimapi.com/v1/api/the-loai/hanh-dong?page=1"),
          axios.get("https://phimapi.com/v1/api/quoc-gia/han-quoc?page=1"),
          axios.get("https://phimapi.com/v1/api/danh-sach/phim-bo?page=1")
        ]);
        setData({
          latest: latest.data.items || [],
          hanhDong: hanhDong.data.data.items || [],
          hanQuoc: hanQuoc.data.data.items || [],
          phimBo: phimBo.data.data.items || [],
          history: getHistory()
        });
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const MovieSection = ({ title, link, movies, isHistory = false }) => (
    <Box sx={{ mb: 6 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2.5 }}>
        <Typography variant="h5" sx={{ fontWeight: "800", borderLeft: "5px solid #1976d2", pl: 1.5 }}>
          {title}
        </Typography>
        <Button component={Link} to={link} variant="text" sx={{ fontWeight: 'bold' }}>Xem tất cả</Button>
      </Box>
      <Grid container spacing={2}>
        {movies.slice(0, 10).map((m) => (
          <MovieCard key={m._id || m.slug} movie={m} isHistory={isHistory} />
        ))}
      </Grid>
    </Box>
  );

  if (loading) return <Container maxWidth="xl" sx={{ mt: 5 }}><Skeleton variant="rectangular" height="50vh" /></Container>;

  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 8 }}>
      <Helmet><title>HdoPhim - Trang Chủ</title></Helmet>

      {/* Banner ở đây (Giữ nguyên logic Swiper của bạn) */}
      
      {data.history.length > 0 && (
        <MovieSection title="Tiếp tục xem" link="/lich-su" movies={data.history} isHistory={true} />
      )}

      <MovieSection title="🔥 Phim mới cập nhật" link="/phim-moi-cap-nhat" movies={data.latest} />
      <MovieSection title="🎬 Phim Hành Động" link="/the-loai/hanh-dong" movies={data.hanhDong} />
      <MovieSection title="📺 Phim Bộ Mới" link="/danh-sach/phim-bo" movies={data.phimBo} />
    </Container>
  );
}

export default Home;
