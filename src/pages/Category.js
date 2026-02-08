import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const categories = [
  "hanh-dong","hai-huoc","tinh-cam","tam-ly","kinh-di","hoat-hinh","vo-thuat","co-trang","phieu-luu","vien-tuong"
];
const countries = [
  "trung-quoc","han-quoc","nhat-ban","thai-lan","au-my","viet-nam","hong-kong","an-do","anh","phap"
];
const years = Array.from({length: 26}, (_,i) => 2000+i); // 2000-2025

function Category() {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [movies, setMovies] = useState([]);

  useEffect(() => {
    if (selectedCategory || selectedCountry || selectedYear) {
      axios.get(`https://phimapi.com/v1/api/danh-sach/phim-bo?page=1&category=${selectedCategory}&country=${selectedCountry}&year=${selectedYear}`)
        .then(res => setMovies(res.data.items));
    }
  }, [selectedCategory, selectedCountry, selectedYear]);

  return (
    <div>
      <h2>Lọc phim</h2>
      <div>
        <label>Thể loại: </label>
        <select onChange={e => setSelectedCategory(e.target.value)}>
          <option value="">--Chọn--</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <label>Quốc gia: </label>
        <select onChange={e => setSelectedCountry(e.target.value)}>
          <option value="">--Chọn--</option>
          {countries.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <label>Năm: </label>
        <select onChange={e => setSelectedYear(e.target.value)}>
          <option value="">--Chọn--</option>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

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

export default Category;
