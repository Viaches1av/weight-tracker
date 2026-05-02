// src/utils/chartHelpers.js

/**
 * Больше не используется для отрисовки графика,
 * но может пригодиться для других целей
 */

/**
 * Определяет тренд между двумя значениями
 * @param {number} prevValue - предыдущее значение
 * @param {number} currentValue - текущее значение
 * @returns {string} 'up', 'down' или 'same'
 */
export const getTrend = (prevValue, currentValue) => {
  if (currentValue > prevValue) return 'up';
  if (currentValue < prevValue) return 'down';
  return 'same';
};

/**
 * Возвращает цвет для значения в зависимости от тренда
 * @param {string} trend - тренд
 * @returns {string} цвет в hex
 */
export const getTrendColor = (trend) => {
  switch (trend) {
    case 'up': return '#E74C3C';
    case 'down': return '#27AE60';
    default: return '#F39C12';
  }
};