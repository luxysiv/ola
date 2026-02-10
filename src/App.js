// src/App.js
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import Search from "./pages/Search";
import CategoryPage from "./pages/CategoryPage";
import CountryPage from "./pages/CountryPage";
import YearPage from "./pages/YearPage";
import MovieDetail from "./pages/MovieDetail";
import TypeListPage from "./pages/TypeListPage"; // thêm mới

function App() {
  return (
    <Router>
      <nav style={{ marginBottom: "20px" }}>
        <Link to="/">Trang chủ</Link> |{" "}
        <Link to="/search">Tìm kiếm</Link> |{" "}
        <Link to="/category">Thể loại</Link> |{" "}
        <Link to="/country/">Quốc gia</Link> |{" "}
        <Link to="/year">Năm</Link> |{" "}
        <Link to="/list/phim-bo">Phim Bộ</Link> |{" "}
        <Link to="/list/phim-le">Phim Lẻ</Link> |{" "}
        <Link to="/list/hoat-hinh">Hoạt Hình</Link>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/category/:category" element={<CategoryPage />} />
        <Route path="/country/:country" element={<CountryPage />} />
        <Route path="/year/:year" element={<YearPage />} />
        <Route path="/movie/:slug" element={<MovieDetail />} />
        <Route path="/list/:type_list" element={<TypeListPage />} /> {/* mới */}
      </Routes>
    </Router>
  );
}

export default App;
