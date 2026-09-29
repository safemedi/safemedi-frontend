export const toggleSelection = (list: string[], item: string) => {
  return list.includes(item) ? list.filter((value) => value !== item) : [...list, item];
};
