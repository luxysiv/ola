// src/App.js
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Search from "./pages/Search";
import CategoryPage from "./pages/CategoryPage";
import CountryPage from "./pages/CountryPage";
import YearPage from "./pages/YearPage";
import MovieDetail from "./pages/MovieDetail";
import TypeListPage from "./pages/TypeListPage";
import Header from "./components/Header";

function App() {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Search />} />
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
