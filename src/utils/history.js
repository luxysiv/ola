const KEY = "movie_history";

export const getHistory = () => {
  const data = localStorage.getItem(KEY);
  return data ? JSON.parse(data) : [];
};

export const saveHistoryItem = (item) => {
  let history = getHistory();

  // bỏ bản ghi cũ nếu có
  history = history.filter(m => m.slug !== item.slug);

  // thêm lên đầu danh sách
  history.unshift(item);

  // giới hạn số lượng
  history = history.slice(0, 50);

  localStorage.setItem(KEY, JSON.stringify(history));
};

export const removeHistoryItem = slug => {
  const history = getHistory().filter(m => m.slug !== slug);
  localStorage.setItem(KEY, JSON.stringify(history));
};

export const clearHistory = () => {
  localStorage.removeItem(KEY);
};
