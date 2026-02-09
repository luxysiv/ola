// src/pages/Home.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

function Home() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);

    axios
      .get("https://phimapi.com/danh-sach/phim-moi-cap-nhat-v3?page=1")
      .then(res => {
        setMovies(res.data.items || []);
      })
      .catch(() => setMovies([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h2>Phim mới cập nhật</h2>

      {loading && <p>Đang tải...</p>}

      <ul>
        {movies.map(m => (
          <li key={m._id}>
            <Link to={`/movie/${m.slug}`}>
              {m.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Home;
