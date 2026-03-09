import React from "react";
import { Grid, Card, CardMedia, CardContent, Typography, Box } from "@mui/material";
import { Link } from "react-router-dom";

// Hàm bổ trợ dùng chung
const normalize = (str = "") =>
  str.toString().toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d").replace(/[()#]/g, "")
    .replace(/\s+/g, "-").replace(/-+/g, "-").trim();

const getPosterUrl = (url) => {
  if (!url) return "/no-image.jpg";
  return url.startsWith("http") ? url : `https://phimimg.com/${url}`;
};

function MovieCard({ movie, isHistory = false }) {
  const movieLink = isHistory 
    ? `/phim/${movie.slug}?${normalize(movie.server)}&${normalize(movie.episode)}`
    : `/phim/${movie.slug}`;

  return (
    <Grid item xs={6} sm={4} md={3} lg={2.4}>
      <Card
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 2,
          overflow: 'hidden',
          transition: "all 0.3s ease",
          border: '1px solid rgba(255,255,255,0.05)',
          "&:hover": {
            transform: "translateY(-8px)",
            boxShadow: "0 12px 24px rgba(0,0,0,0.5)",
          }
        }}
      >
        <Link to={movieLink} style={{ textDecoration: 'none', color: 'inherit' }}>
          {/* Box này ép tỷ lệ ảnh luôn là 2:3 (chuẩn poster) */}
          <Box sx={{ position: 'relative', pt: '145%', width: '100%' }}>
            <CardMedia
              component="img"
              image={getPosterUrl(movie.poster_url || movie.poster)}
              alt={movie.name}
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
              onError={(e) => { e.target.src = "/no-image.jpg"; }}
            />
            {!isHistory && (
              <Box sx={{
                position: 'absolute', top: 8, left: 8, bgcolor: 'primary.main',
                color: 'white', px: 1, borderRadius: 1, fontSize: '0.7rem', fontWeight: 'bold'
              }}>
                {movie.quality || 'HD'}
              </Box>
            )}
          </Box>

          <CardContent sx={{ p: 1.5, flexGrow: 1 }}>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: '600',
                height: 38, // Cố định 2 dòng để các ô luôn thẳng hàng
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                lineHeight: 1.2,
                fontSize: '0.9rem'
              }}
            >
              {movie.name}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap display="block" sx={{ mt: 0.5 }}>
              {isHistory ? `Tập: ${movie.episode}` : `${movie.year} • ${movie.lang || 'Vietsub'}`}
            </Typography>
          </CardContent>
        </Link>
      </Card>
    </Grid>
  );
}

export default MovieCard;
