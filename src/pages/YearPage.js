// src/pages/YearPage.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useParams, useNavigate } from "react-router-dom";

const years = Array.from({ length: 26 }, (_, i) => 2000 + i);

function YearPage() {
  const { year } = useParams();
  const navigate = useNavigate();

  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!year) return;

    setLoading(true);

    axios
      .get(`https://phimapi.com/v1/api/nam/${year}?page=1`)
      .then(res => {
        setMovies(res.data?.data?.items || []);
      })
      .catch(() => setMovies([]))
      .finally(() => setLoading(false));
  }, [year]);

  return (
    <div className="container">
      <h2>Năm phát hành: {year}</h2>

      {/* Chọn năm */}
      <select
        value={year || ""}
        onChange={(e) => navigate(`/year/${e.target.value}`)}
      >
        <option value="">--Chọn năm--</option>
        {years.map(y => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>

      {loading && <p>Đang tải...</p>}

      {/* Grid phim */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fill, minmax(150px, 1fr))",
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
                src={
                  m.poster_url
                    ? `https://phimimg.com/${m.poster_url}`
                    : "/no-image.jpg"
                }
                alt={m.name}
                style={{
                  width: "100%",
                  borderRadius: 6,
                  objectFit: "cover"
                }}
              />

              <div style={{ marginTop: 5 }}>
                <b>{m.name}</b>
              </div>

              <div style={{ fontSize: 13, opacity: 0.8 }}>
                {m.year} • {m.quality}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default YearPage;
