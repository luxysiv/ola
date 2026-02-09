import React, { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

import {
  Container,
  TextField,
  Button,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Typography
} from "@mui/material";

function Search() {
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState([]);

  const handleSearch = async () => {
    const res = await axios.get(
      `https://phimapi.com/v1/api/tim-kiem?keyword=${keyword}`
    );

    setResults(res.data.data.items || []);
  };

  return (
    <Container sx={{ mt: 3 }}>
      <Typography variant="h5" gutterBottom>
        Tìm kiếm phim
      </Typography>

      <TextField
        fullWidth
        label="Nhập tên phim"
        value={keyword}
        onChange={e => setKeyword(e.target.value)}
      />

      <Button
        variant="contained"
        sx={{ mt: 2 }}
        onClick={handleSearch}
      >
        Tìm
      </Button>

      <Grid container spacing={2} sx={{ mt: 2 }}>
        {results.map(movie => (
          <Grid item xs={6} sm={4} md={3} key={movie._id}>
            <Card>
              <Link to={`/movie/${movie.slug}`}>
                <CardMedia
                  component="img"
                  height="260"
                  image={`https://phimimg.com/${movie.poster_url}`}
                />
              </Link>

              <CardContent>
                <Typography variant="body2">
                  {movie.name}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}

export default Search;
