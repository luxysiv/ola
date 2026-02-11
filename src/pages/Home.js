// src/pages/Home.js
import React from "react";
import { Container, Typography, Grid, Card, CardMedia, CardContent, Box, Button } from "@mui/material";
import { Link } from "react-router-dom";

function Home() {
  const featuredCategories = [
    { slug: "hanh-dong", name: "Hành động" },
    { slug: "co-trang", name: "Cổ Trang" },
    { slug: "tinh-cam", name: "Tình Cảm" }
  ];

  const featuredCountries = [
    { slug: "han-quoc", name: "Hàn Quốc" },
    { slug: "trung-quoc", name: "Trung Quốc" },
    { slug: "viet-nam", name: "Việt Nam" }
  ];

  const featuredTypes = [
    { slug: "phim-bo", name: "Phim Bộ" },
    { slug: "phim-le", name: "Phim Lẻ" },
    { slug: "hoat-hinh", name: "Hoạt Hình" }
  ];

  return (
    <Container sx={{ mt: 3 }}>
      <Typography variant="h4" gutterBottom>🎬 Hdophim - Trang chủ</Typography>

      {/* Section Thể loại */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>Thể loại tiêu biểu</Typography>
        <Grid container spacing={2}>
          {featuredCategories.map(c => (
            <Grid item xs={12} sm={4} key={c.slug}>
              <Card>
                <Link to={`/category/${c.slug}`}>
                  <CardMedia component="img" height="180" image="/category.jpg" />
                </Link>
                <CardContent>
                  <Typography variant="h6">{c.name}</Typography>
                  <Button component={Link} to={`/category/${c.slug}`} size="small">Xem thêm</Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Section Quốc gia */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>Quốc gia tiêu biểu</Typography>
        <Grid container spacing={2}>
          {featuredCountries.map(c => (
            <Grid item xs={12} sm={4} key={c.slug}>
              <Card>
                <Link to={`/country/${c.slug}`}>
                  <CardMedia component="img" height="180" image="/country.jpg" />
                </Link>
                <CardContent>
                  <Typography variant="h6">{c.name}</Typography>
                  <Button component={Link} to={`/country/${c.slug}`} size="small">Xem thêm</Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Section Loại phim */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>Loại phim tiêu biểu</Typography>
        <Grid container spacing={2}>
          {featuredTypes.map(t => (
            <Grid item xs={12} sm={4} key={t.slug}>
              <Card>
                <Link to={`/list/${t.slug}`}>
                  <CardMedia component="img" height="180" image="/type.jpg" />
                </Link>
                <CardContent>
                  <Typography variant="h6">{t.name}</Typography>
                  <Button component={Link} to={`/list/${t.slug}`} size="small">Xem thêm</Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  );
}

export default Home;
