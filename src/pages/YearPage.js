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
        setMovies(res.data.data.items || []);
      })
      .catch(() => setMovies([]))
      .finally(() => setLoading(false));
  }, [year]);

  return (
    <div className="container">
      <h2>Năm: {year}</h2>

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

export default YearPage;
