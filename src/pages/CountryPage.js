import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useParams } from "react-router-dom";

const countries = ["trung-quoc","han-quoc","nhat-ban","thai-lan","au-my","viet-nam","hong-kong","an-do","anh","phap"];

function CountryPage() {
  const { country } = useParams();
  const [movies, setMovies] = useState([]);

  useEffect(() => {
    axios.get(`https://phimapi.com/v1/api/danh-sach/phim-bo?page=1&country=${country}`)
      .then(res => {
        if (res.data && res.data.items) setMovies(res.data.items);
      });
  }, [country]);

  return (
    <div>
      <h2>Quốc gia: {country}</h2>
      <select onChange={e => window.location.href=`/country/${e.target.value}`}>
        <option value="">--Chọn quốc gia--</option>
        {countries.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
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

export default CountryPage;
