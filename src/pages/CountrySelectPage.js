// src/pages/CountrySelectPage.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Container, Typography, Select, MenuItem } from "@mui/material";

function CountrySelectPage() {
  const [countries, setCountries] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get("https://phimapi.com/quoc-gia")
      .then(res => setCountries(res.data || []))
      .catch(() => setCountries([]));
  }, []);

  return (
    <Container sx={{ mt: 3 }}>
      <Typography variant="h5" gutterBottom>
        Chọn quốc gia
      </Typography>
      <Select
        fullWidth
        value=""
        onChange={e => navigate(`/country/${e.target.value}`)}
      >
        <MenuItem value="">--Chọn quốc gia--</MenuItem>
        {countries.map(c => (
          <MenuItem key={c._id} value={c.slug}>
            {c.name}
          </MenuItem>
        ))}
      </Select>
    </Container>
  );
}

export default CountrySelectPage;
