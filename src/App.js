import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import Search from "./pages/Search";
import CategoryPage from "./pages/CategoryPage";
import CountryPage from "./pages/CountryPage";
import YearPage from "./pages/YearPage";
import MovieDetail from "./pages/MovieDetail";

function App() {
  return (
    <Router>
      <nav>
        <Link to="/">Trang chủ</Link> | 
        <Link to="/search">Tìm kiếm</Link> | 
        <Link to="/category/hanh-dong">Thể loại</Link> | 
        <Link to="/country/han-quoc">Quốc gia</Link> | 
        <Link to="/year/2024">Năm</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/category/:category" element={<CategoryPage />} />
        <Route path="/country/:country" element={<CountryPage />} />
        <Route path="/year/:year" element={<YearPage />} />
        <Route path="/movie/:slug" element={<MovieDetail />} />
      </Routes>
    </Router>
  );
}

export default App;
