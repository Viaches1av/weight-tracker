// src/utils/statistics.js
/**
 * Вычисляет статистику по измерениям
 * @param {Array} measurements - массив измерений
 * @returns {Object} объект со статистикой
 */
export const calculateStatistics = (measurements) => {
  if (!measurements || measurements.length === 0) {
    return {
      count: 0,
      average: 0,
      min: 0,
      max: 0,
      firstValue: 0,
      lastValue: 0,
      absoluteChange: 0,
      percentChange: 0,
    };
  }

  const sortedData = [...measurements].sort(
    (a, b) => new Date(a.date) - new Date(b.date),
  );
  const values = sortedData.map((m) => m.value);

  const count = values.length;
  const sum = values.reduce((acc, val) => acc + val, 0);
  const average = sum / count;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const firstValue = values[0];
  const lastValue = values[values.length - 1];
  const absoluteChange = lastValue - firstValue;
  const percentChange =
    firstValue !== 0 ? (absoluteChange / firstValue) * 100 : 0;

  return {
    count,
    average: Math.round(average * 100) / 100,
    min,
    max,
    firstValue,
    lastValue,
    absoluteChange: Math.round(absoluteChange * 100) / 100,
    percentChange: Math.round(percentChange * 100) / 100,
  };
};

/**
 * Рассчитывает прогресс достижения цели
 * @param {Array} measurements - измерения
 * @param {Object} goal - цель
 * @returns {number} процент прогресса (0-100)
 */
export const calculateGoalProgress = (measurements, goal) => {
  if (!measurements || measurements.length === 0 || !goal) {
    return 0;
  }

  const sortedData = [...measurements].sort(
    (a, b) => new Date(a.date) - new Date(b.date),
  );
  const initialValue = sortedData[0].value;
  const currentValue = measurements[measurements.length - 1].value;
  const targetValue = goal.target_value;

  const totalChange = Math.abs(initialValue - targetValue);
  const currentChange = Math.abs(initialValue - currentValue);

  if (totalChange === 0) {
    return 100;
  }

  return Math.min(100, (currentChange / totalChange) * 100);
};

/**
 * Проверяет, достигнута ли цель
 * @param {Array} measurements - измерения
 * @param {Object} goal - цель
 * @returns {boolean}
 */
export const isGoalAchieved = (measurements, goal) => {
  if (!measurements || measurements.length === 0 || !goal) {
    return false;
  }

  const initialValue = measurements[0].value;
  const currentValue = measurements[measurements.length - 1].value;
  const targetValue = goal.target_value;

  // Если начальное значение больше целевого - нужно снижаться
  if (initialValue > targetValue) {
    return currentValue <= targetValue;
  }

  // Если начальное значение меньше целевого - нужно повышаться
  return currentValue >= targetValue;
};
