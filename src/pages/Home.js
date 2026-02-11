// src/pages/Home.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  Container,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CircularProgress,
  Box,
  Rating,
  Chip,
  IconButton,
  Paper,
  alpha,
  useTheme,
  Skeleton
} from "@mui/material";
import {
  PlayCircleOutline,
  Star,
  Movie,
  TrendingUp,
  Whatshot,
  CalendarToday,
  HighQuality
} from "@mui/icons-material";

function Home() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();

  useEffect(() => {
    axios
      .get("https://phimapi.com/danh-sach/phim-moi-cap-nhat-v3?page=1")
      .then(res => {
        setMovies(res.data.items || []);
      })
      .catch(() => setMovies([]))
      .finally(() => setLoading(false));
  }, []);

  const MovieSkeleton = () => (
    <Grid item xs={6} sm={4} md={3} lg={2}>
      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Skeleton variant="rectangular" height={250} />
        <CardContent>
          <Skeleton variant="text" height={28} />
          <Skeleton variant="text" width="60%" height={20} />
        </CardContent>
      </Card>
    </Grid>
  );

  return (
    <Box sx={{ bgcolor: theme.palette.background.default, minHeight: '100vh', py: 4 }}>
      <Container maxWidth="xl">
        {/* Hero Section */}
        <Paper 
          elevation={0}
          sx={{
            p: 4,
            mb: 4,
            borderRadius: 3,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.9)} 0%, ${alpha(theme.palette.secondary.dark, 0.8)} 100%)`,
            color: 'white',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <Box sx={{ position: 'relative', zIndex: 2 }}>
            <Typography variant="h3" fontWeight="bold" gutterBottom>
              <Whathot sx={{ fontSize: 40, mr: 2, verticalAlign: 'middle' }} />
              KKPim Player
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9, mb: 2 }}>
              Xem phim miễn phí, chất lượng cao, cập nhật liên tục
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Chip 
                icon={<Movie />} 
                label="10,000+ Phim" 
                sx={{ bgcolor: alpha('#fff', 0.2), color: 'white', backdropFilter: 'blur(5px)' }}
              />
              <Chip 
                icon={<HighQuality />} 
                label="HD, Full HD" 
                sx={{ bgcolor: alpha('#fff', 0.2), color: 'white', backdropFilter: 'blur(5px)' }}
              />
              <Chip 
                icon={<CalendarToday />} 
                label="Cập nhật mỗi ngày" 
                sx={{ bgcolor: alpha('#fff', 0.2), color: 'white', backdropFilter: 'blur(5px)' }}
              />
            </Box>
          </Box>
        </Paper>

        {/* Section Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Whatshot sx={{ color: theme.palette.error.main, fontSize: 32 }} />
            Phim mới cập nhật
            <Chip 
              label="Mới" 
              size="small" 
              color="error" 
              sx={{ ml: 1, fontWeight: 'bold' }}
            />
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {movies.length} phim
          </Typography>
        </Box>

        {/* Loading State */}
        {loading ? (
          <Grid container spacing={2}>
            {[...Array(12)].map((_, index) => (
              <MovieSkeleton key={index} />
            ))}
          </Grid>
        ) : (
          <>
            {/* Movie Grid */}
            <Grid container spacing={3}>
              {movies.map((movie, index) => (
                <Grid item xs={6} sm={4} md={3} lg={2} key={movie._id}>
                  <Card 
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      position: 'relative',
                      transition: 'transform 0.3s, box-shadow 0.3s',
                      borderRadius: 2,
                      overflow: 'hidden',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: theme.shadows[12],
                        '& .play-button': {
                          opacity: 1,
                          transform: 'translate(-50%, -50%) scale(1)'
                        },
                        '& .movie-poster': {
                          transform: 'scale(1.1)'
                        }
                      }
                    }}
                  >
                    {/* Poster Container */}
                    <Box sx={{ position: 'relative', pt: '150%', bgcolor: theme.palette.grey[900] }}>
                      <Link to={`/movie/${movie.slug}`} style={{ textDecoration: 'none' }}>
                        <CardMedia
                          component="img"
                          className="movie-poster"
                          image={
                            movie.poster_url?.startsWith("http")
                              ? movie.poster_url
                              : `https://phimimg.com/${movie.poster_url}`
                          }
                          alt={movie.name}
                          onError={(e) => {
                            e.target.src = "https://via.placeholder.com/300x450?text=No+Image";
                          }}
                          sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            transition: 'transform 0.5s'
                          }}
                        />
                        
                        {/* Play Button Overlay */}
                        <IconButton
                          className="play-button"
                          sx={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%) scale(0.8)',
                            opacity: 0,
                            transition: 'all 0.3s',
                            bgcolor: alpha(theme.palette.primary.main, 0.9),
                            color: 'white',
                            '&:hover': {
                              bgcolor: theme.palette.primary.main,
                              transform: 'translate(-50%, -50%) scale(1.1) !important'
                            }
                          }}
                        >
                          <PlayCircleOutline sx={{ fontSize: 48 }} />
                        </IconButton>

                        {/* Quality Badge */}
                        {movie.quality && (
                          <Chip
                            label={movie.quality}
                            size="small"
                            sx={{
                              position: 'absolute',
                              top: 8,
                              right: 8,
                              bgcolor: theme.palette.primary.main,
                              color: 'white',
                              fontWeight: 'bold',
                              fontSize: '0.7rem'
                            }}
                          />
                        )}

                        {/* Year Badge */}
                        {movie.year && (
                          <Chip
                            label={movie.year}
                            size="small"
                            sx={{
                              position: 'absolute',
                              bottom: 8,
                              left: 8,
                              bgcolor: alpha('#000', 0.7),
                              color: 'white',
                              fontSize: '0.7rem'
                            }}
                          />
                        )}

                        {/* Episode/Status Badge */}
                        {movie.episode_current && (
                          <Chip
                            label={movie.episode_current}
                            size="small"
                            sx={{
                              position: 'absolute',
                              bottom: 8,
                              right: 8,
                              bgcolor: alpha(theme.palette.error.main, 0.9),
                              color: 'white',
                              fontSize: '0.7rem'
                            }}
                          />
                        )}
                      </Link>
                    </Box>

                    {/* Movie Info */}
                    <CardContent sx={{ flexGrow: 1, p: 2, pb: 2 }}>
                      <Typography 
                        variant="body1" 
                        fontWeight="bold"
                        sx={{
                          mb: 0.5,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          lineHeight: 1.2,
                          height: '2.4em'
                        }}
                      >
                        {movie.name}
                      </Typography>
                      
                      <Typography 
                        variant="caption" 
                        color="text.secondary"
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          mb: 1
                        }}
                      >
                        <Star sx={{ fontSize: 14, color: theme.palette.warning.main }} />
                        {movie.rating || '8.5'} • {movie.language || 'Vietsub'}
                      </Typography>

                      {/* Movie Tags */}
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {movie.category?.slice(0, 2).map((cat, idx) => (
                          <Chip
                            key={idx}
                            label={cat.name}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.65rem', height: 20 }}
                          />
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* Empty State */}
            {movies.length === 0 && !loading && (
              <Box 
                sx={{ 
                  textAlign: 'center', 
                  py: 8,
                  px: 2,
                  bgcolor: theme.palette.background.paper,
                  borderRadius: 2
                }}
              >
                <Movie sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Không tìm thấy phim nào
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Vui lòng thử lại sau
                </Typography>
              </Box>
            )}
          </>
        )}

        {/* Back to Top Button - Optional */}
        {movies.length > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Chip
              icon={<TrendingUp />}
              label="Xem thêm phim"
              component={Link}
              to="/phim-moi"
              clickable
              color="primary"
              variant="outlined"
              sx={{ 
                px: 3, 
                py: 2.5, 
                borderRadius: 3,
                '&:hover': {
                  bgcolor: theme.palette.primary.main,
                  color: 'white'
                }
              }}
            />
          </Box>
        )}
      </Container>
    </Box>
  );
}

export default Home;
