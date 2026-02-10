// src/pages/TypeListSelectPage.js
import React from "react";
import { useNavigate } from "react-router-dom";
import { Container, Typography, Select, MenuItem } from "@mui/material";

const types = [
  { slug: "phim-bo", name: "Phim Bộ" },
  { slug: "phim-le", name: "Phim Lẻ" },
  { slug: "tv-shows", name: "TV Shows" },
  { slug: "hoat-hinh", name: "Hoạt Hình" },
  { slug: "phim-vietsub", name: "Phim Vietsub" },
  { slug: "phim-thuyet-minh", name: "Phim Thuyết Minh" },
  { slug: "phim-long-tieng", name: "Phim Lồng Tiếng" }
];

function TypeListSelectPage() {
  const navigate = useNavigate();

  return (
    <Container sx={{ mt: 3 }}>
      <Typography variant="h5" gutterBottom>
        Chọn loại phim
      </Typography>
      <Select
        fullWidth
        value=""
        onChange={e => navigate(`/list/${e.target.value}`)}
      >
        <MenuItem value="">--Chọn loại phim--</MenuItem>
        {types.map(t => (
          <MenuItem key={t.slug} value={t.slug}>
            {t.name}
          </MenuItem>
        ))}
      </Select>
    </Container>
  );
}

export default TypeListSelectPage;
