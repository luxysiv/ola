// src/pages/CategoryPage.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useParams, useNavigate } from "react-router-dom";

function CategoryPage() {
  const { category } = useParams();
  const navigate = useNavigate();

  const [movies, setMovies] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  // load danh sách thể loại
  useEffect(() => {
    axios.get("https://phimapi.com/the-loai")
      .then(res => setCategories(res.data))
      .catch(() => setCategories([]));
  }, []);

  // load phim theo thể loại
  useEffect(() => {
    if (!category) return;

    setLoading(true);

    axios
      .get(`https://phimapi.com/v1/api/the-loai/${category}?page=1`)
      .then(res => {
        setMovies(res.data.data.items || []);
      })
      .catch(() => setMovies([]))
      .finally(() => setLoading(false));
  }, [category]);

  return (
    <div className="container">
      <h2>Thể loại: {category}</h2>

      <select
        value={category || ""}
        onChange={e => navigate(`/category/${e.target.value}`)}
      >
        <option value="">--Chọn thể loại--</option>
        {categories.map(c => (
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

export default CategoryPage;
