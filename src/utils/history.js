const KEY = "movie_history";

export const getHistory = () => {
  const data = localStorage.getItem(KEY);
  return data ? JSON.parse(data) : [];
};

export const saveHistoryItem = (item) => {
  if (!item?.slug) return;

  let history = getHistory();

  // ❗ Chỉ giữ 1 record duy nhất cho mỗi phim
  history = history.filter(m => m.slug !== item.slug);

  history.unshift({
    ...item,
    episode: String(item.episode), // normalize
    currentTime: Math.floor(item.currentTime || 0),
    updatedAt: Date.now()
  });

  history = history.slice(0, 50);

  localStorage.setItem(KEY, JSON.stringify(history));
};

export const removeHistoryItem = (slug) => {
  const history = getHistory().filter(m => m.slug !== slug);
  localStorage.setItem(KEY, JSON.stringify(history));
};

export const clearHistory = () => {
  localStorage.removeItem(KEY);
};
