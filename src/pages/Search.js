import React, { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

function Search() {
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState([]);

  const handleSearch = async () => {
    const res = await axios.get(`https://phimapi.com/v1/api/tim-kiem?keyword=${keyword}&page=1`);
    setResults(res.data.items);
  };

  return (
    <div>
      <h2>Tìm kiếm phim</h2>
      <input value={keyword} onChange={e => setKeyword(e.target.value)} />
      <button onClick={handleSearch}>Tìm</button>
      <ul>
        {results.map(r => (
          <li key={r._id}>
            <Link to={`/movie/${r.slug}`}>{r.name}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Search;
