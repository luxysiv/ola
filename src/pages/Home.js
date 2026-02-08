import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

function Home() {
  const [movies, setMovies] = useState([]);

  useEffect(() => {
    axios.get("https://phimapi.com/danh-sach/phim-moi-cap-nhat?page=1")
      .then(res => setMovies(res.data.items));
  }, []);

  return (
    <div>
      <h2>Phim mới cập nhật</h2>
      <ul>
        {movies.map(m => (
          <li key={m._id}>
            <Link to={`/movie/${m.slug}`}>{m.name}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Home;
