// src/pages/Search.js
import React, { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

function Search() {
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!keyword.trim()) return;

    try {
      setLoading(true);

      const res = await axios.get(
        `https://phimapi.com/v1/api/tim-kiem?keyword=${encodeURIComponent(
          keyword
        )}&page=1`
      );

      // ✅ dữ liệu đúng nằm ở đây
      setResults(res.data.data.items || []);
    } catch (err) {
      console.error("Search error:", err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h2>Tìm kiếm phim</h2>

      <div style={{ marginBottom: 12 }}>
        <input
          value={keyword}
          placeholder="Nhập tên phim..."
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <button onClick={handleSearch}>Tìm</button>
      </div>

      {loading && <p>Đang tìm...</p>}

      {!loading && results.length === 0 && <p>Không có kết quả</p>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, 150px)", gap: 15 }}>
        {results.map((r) => (
          <Link
            key={r._id}
            to={`/movie/${r.slug}`}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <div>
              <img
                src={`https://phimimg.com/${r.poster_url}`}
                alt={r.name}
                width="150"
                style={{ borderRadius: 6 }}
              />
              <div>
                <b>{r.name}</b>
              </div>
              <div>{r.year} • {r.quality}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default Search;
