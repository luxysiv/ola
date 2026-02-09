import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useParams } from "react-router-dom";

const categories = ["hanh-dong","hai-huoc","tinh-cam","tam-ly","kinh-di","hoat-hinh","vo-thuat","co-trang","phieu-luu","vien-tuong"];

function CategoryPage() {
  const { category } = useParams();
  const [movies, setMovies] = useState([]);

  useEffect(() => {
    axios.get(`https://phimapi.com/v1/api/danh-sach/phim-bo?page=1&category=${category}`)
      .then(res => {
        if (res.data && res.data.items) setMovies(res.data.items);
      });
  }, [category]);

  return (
    <div>
      <h2>Thể loại: {category}</h2>
      <select onChange={e => window.location.href=`/category/${e.target.value}`}>
        <option value="">--Chọn thể loại--</option>
        {categories.map(c => <option key={c} value={c}>{c}</option>)}
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

export default CategoryPage;
