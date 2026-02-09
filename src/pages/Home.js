// src/pages/Home.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

function Home() {
  const [movies, setMovies] = useState([]);

  useEffect(() => {
    axios
      .get("https://phimapi.com/danh-sach/phim-moi-cap-nhat-v3?page=1")
      .then(res => setMovies(res.data.items || []));
  }, []);

  return (
    <div>
      <h2>Phim mới cập nhật</h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, 150px)",
          gap: 15
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
                src={m.poster_url}
                alt={m.name}
                width="150"
                style={{ borderRadius: 6 }}
              />
              <div style={{ marginTop: 5 }}>
                <b>{m.name}</b>
              </div>
              <small>
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
