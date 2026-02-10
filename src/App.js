import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import Search from "./pages/Search";
import CategoryPage from "./pages/CategoryPage";
import CountryPage from "./pages/CountryPage";
import YearPage from "./pages/YearPage";
import MovieDetail from "./pages/MovieDetail";
import TypeListPage from "./pages/TypeListPage";

import CategorySelectPage from "./pages/CategorySelectPage";
import CountrySelectPage from "./pages/CountrySelectPage";
import YearSelectPage from "./pages/YearSelectPage";
import TypeListSelectPage from "./pages/TypeListSelectPage";

function App() {
  return (
    <Router>
      <nav style={{ marginBottom: "20px" }}>
        <Link to="/">Trang chủ</Link> |{" "}
        <Link to="/search">Tìm kiếm</Link> |{" "}
        <Link to="/category">Thể loại</Link> |{" "}
        <Link to="/country">Quốc gia</Link> |{" "}
        <Link to="/year">Năm</Link> |{" "}
        <Link to="/list">Loại phim</Link>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Search />} />

        {/* Trang lựa chọn */}
        <Route path="/category" element={<CategorySelectPage />} />
        <Route path="/country" element={<CountrySelectPage />} />
        <Route path="/year" element={<YearSelectPage />} />
        <Route path="/list" element={<TypeListSelectPage />} />

        {/* Trang chi tiết */}
        <Route path="/category/:category" element={<CategoryPage />} />
        <Route path="/country/:country" element={<CountryPage />} />
        <Route path="/year/:year" element={<YearPage />} />
        <Route path="/list/:type_list" element={<TypeListPage />} />

        <Route path="/movie/:slug" element={<MovieDetail />} />
      </Routes>
    </Router>
  );
}

export default App;
