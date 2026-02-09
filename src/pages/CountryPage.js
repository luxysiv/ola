// src/pages/CountryPage.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useParams, useNavigate } from "react-router-dom";

function CountryPage() {
  const { country } = useParams();
  const navigate = useNavigate();

  const [movies, setMovies] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(false);

  // load danh sách quốc gia
  useEffect(() => {
    axios.get("https://phimapi.com/quoc-gia")
      .then(res => setCountries(res.data))
      .catch(() => setCountries([]));
  }, []);

  // load phim theo quốc gia
  useEffect(() => {
    if (!country) return;

    setLoading(true);

    axios
      .get(`https://phimapi.com/v1/api/quoc-gia/${country}?page=1`)
      .then(res => {
        setMovies(res.data.data.items || []);
      })
      .catch(() => setMovies([]))
      .finally(() => setLoading(false));
  }, [country]);

  return (
    <div className="container">
      <h2>Quốc gia: {country}</h2>

      <select
        value={country || ""}
        onChange={e => navigate(`/country/${e.target.value}`)}
      >
        <option value="">--Chọn quốc gia--</option>
        {countries.map(c => (
          <option key={c._id} value={c.slug}>
            {c.name}
          </option>
        ))}
      </select>

      {loading && <p>Đang tải...</p>}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, 150px)",
          gap: 15,
          marginTop: 15
        }}
      >
        {movies.map(m => (
          <Link
            key={m._id}
            to={`/movie/${m.slug}`}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <div>
              <img
                src={`https://phimimg.com/${m.poster_url}`}
                alt={m.name}
                width="150"
                style={{ borderRadius: 6 }}
              />
              <div><b>{m.name}</b></div>
              <div>{m.year} • {m.quality}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default CountryPage;
