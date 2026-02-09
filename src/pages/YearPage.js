import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useParams } from "react-router-dom";

const years = Array.from({length: 26}, (_,i) => 2000+i);

function YearPage() {
  const { year } = useParams();
  const [movies, setMovies] = useState([]);

  useEffect(() => {
    axios.get(`https://phimapi.com/v1/api/danh-sach/phim-bo?page=1&year=${year}`)
      .then(res => {
        if (res.data && res.data.items) setMovies(res.data.items);
      });
  }, [year]);

  return (
    <div>
      <h2>Năm: {year}</h2>
      <select onChange={e => window.location.href=`/year/${e.target.value}`}>
        <option value="">--Chọn năm--</option>
        {years.map(y => <option key={y} value={y}>{y}</option>)}
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

export default YearPage;

