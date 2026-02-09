// src/pages/Home.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

function Home() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get("https://phimapi.com/danh-sach/phim-moi-cap-nhat-v3?page=1")
      .then(res => {
        setMovies(res.data.items || []);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container">
      <h2>🔥 Phim mới cập nhật</h2>

      {loading && <p>Đang tải...</p>}

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
                  m.poster_url?.startsWith("http")
                    ? m.poster_url
                    : `https://phimimg.com/${m.poster_url}`
                }
                alt={m.name}
                style={{
                  width: "100%",
                  borderRadius: 8,
                  objectFit: "cover",
                  aspectRatio: "2/3"
                }}
                onError={(e) => {
                  e.target.src = "/no-image.jpg";
                }}
              />

              <div style={{ marginTop: 6 }}>
                <b>{m.name}</b>
              </div>

              <small style={{ opacity: 0.8 }}>
                {m.year} • {m.quality}
              </small>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default Home;
