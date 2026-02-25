const KEY = "movie_history";

export const getHistory = () => {
  const data = localStorage.getItem(KEY);
  return data ? JSON.parse(data) : [];
};

export const saveHistoryItem = (item) => {
  let history = getHistory();

  // Lọc bỏ bản ghi cũ của ĐÚNG tập đó trong phim đó
  history = history.filter(m => !(m.slug === item.slug && m.episode === item.episode));

  // Thêm mới lên đầu
  history.unshift(item);

  // Giới hạn 50 mục
  history = history.slice(0, 50);

  localStorage.setItem(KEY, JSON.stringify(history));
};

export const removeHistoryItem = (slug, episode) => {
  const history = getHistory().filter(m => !(m.slug === slug && m.episode === episode));
  localStorage.setItem(KEY, JSON.stringify(history));
};

export const clearHistory = () => {
  localStorage.removeItem(KEY);
};
