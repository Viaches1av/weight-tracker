// src/components/ChartView/ChartView.jsx
import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  MarkLineComponent,
  AxisPointerComponent,
  DataZoomComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { calculateStatistics } from '../../utils/statistics';
import styles from './ChartView.module.css';

// Регистрируем компоненты
echarts.use([
  LineChart,
  GridComponent,
  TooltipComponent,
  MarkLineComponent,
  AxisPointerComponent,
  DataZoomComponent,
  CanvasRenderer,
]);

/**
 * Вспомогательная функция для отрисовки цветных сегментов
 */
const drawColoredLineSegments = (
  chart,
  data,
  parameters,
  selectedParameter,
) => {
  if (!chart || !data || data.length < 2) return;

  try {
    const zr = chart.getZr();
    if (!zr) return;

    // Создаем группу для линий
    const group = new echarts.graphic.Group();

    for (let i = 1; i < data.length; i++) {
      const prevData = data[i - 1];
      const currentData = data[i];

      // Получаем координаты на canvas
      const prevPoint = chart.convertToPixel({ xAxisIndex: 0, yAxisIndex: 0 }, [
        prevData.date,
        prevData.value,
      ]);

      const currentPoint = chart.convertToPixel(
        { xAxisIndex: 0, yAxisIndex: 0 },
        [currentData.date, currentData.value],
      );

      const currentParam = parameters.find(
        (p) => p.parameter_name === selectedParameter,
      );
      const trackingType = currentParam?.tracking_type || 'loss';

      if (!prevPoint || !currentPoint) continue;

      // Определяем цвет сегмента
      let color = '#F39C12'; // желтый
      if (currentData.value > prevData.value) {
        // Значение выросло
        color = trackingType === 'loss' ? '#E74C3C' : '#27AE60';
      } else if (currentData.value < prevData.value) {
        // Значение снизилось
        color = trackingType === 'loss' ? '#27AE60' : '#E74C3C';
      }

      // Создаем линию
      const line = new echarts.graphic.Line({
        shape: {
          x1: prevPoint[0],
          y1: prevPoint[1],
          x2: currentPoint[0],
          y2: currentPoint[1],
        },
        style: {
          stroke: color,
          lineWidth: 3,
          lineCap: 'round',
          lineJoin: 'round',
        },
        z: 2,
      });

      group.add(line);
    }

    // Удаляем старую группу
    if (chart._coloredLinesGroup) {
      zr.remove(chart._coloredLinesGroup);
    }

    // Добавляем новую
    zr.add(group);
    chart._coloredLinesGroup = group;
  } catch (error) {
    console.error('Ошибка отрисовки линий:', error);
  }
};

/**
 * Компонент графика с правильными осями и цветными сегментами
 */
function ChartView({
  measurements = [],
  parameters = [],
  goals = [],
  selectedParameter,
  onParameterChange,
  onAddMeasurement,
}) {
  const [timeFilter, setTimeFilter] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showStats, setShowStats] = useState(false);

  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  // Фильтрация измерений
  const filteredMeasurements = useMemo(() => {
    if (!measurements || measurements.length === 0) return [];

    let filtered = measurements.filter(
      (m) => m.parameter === selectedParameter,
    );

    const now = new Date();
    let startDate;

    switch (timeFilter) {
      case '7days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30days':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'custom':
        if (customStartDate) startDate = new Date(customStartDate);
        break;
      default:
        startDate = null;
    }

    if (startDate) {
      filtered = filtered.filter((m) => new Date(m.date) >= startDate);
    }

    if (timeFilter === 'custom' && customEndDate) {
      filtered = filtered.filter(
        (m) => new Date(m.date) <= new Date(customEndDate),
      );
    }

    return filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [
    measurements,
    selectedParameter,
    timeFilter,
    customStartDate,
    customEndDate,
  ]);

  // Получаем цель
  const currentGoal = useMemo(() => {
    return goals.find((g) => g.parameter === selectedParameter) || null;
  }, [goals, selectedParameter]);

  // Статистика
  const statistics = useMemo(() => {
    return calculateStatistics(filteredMeasurements);
  }, [filteredMeasurements]);

  // Инициализация и обновление графика
  useEffect(() => {
    if (!chartRef.current) return;

    // Если нет данных - очищаем
    if (filteredMeasurements.length === 0) {
      if (chartInstance.current) {
        chartInstance.current.clear();
        const zr = chartInstance.current.getZr();
        if (zr && chartInstance.current._coloredLinesGroup) {
          zr.remove(chartInstance.current._coloredLinesGroup);
          chartInstance.current._coloredLinesGroup = null;
        }
      }
      return;
    }

    // Инициализация
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current, null, {
        renderer: 'canvas',
      });
    }

    const chart = chartInstance.current;
    const values = filteredMeasurements.map((m) => m.value);
    const dates = filteredMeasurements.map((m) => m.date);

    // Вычисляем диапазон с учетом цели
    const dataMin = Math.min(...values);
    const dataMax = Math.max(...values);

    let effectiveMin = dataMin;
    let effectiveMax = dataMax;

    if (currentGoal) {
      effectiveMin = Math.min(dataMin, currentGoal.target_value);
      effectiveMax = Math.max(dataMax, currentGoal.target_value);
    }

    // Добавляем отступ 20% ОТ ДИАПАЗОНА
    const range = effectiveMax - effectiveMin || 1;
    const padding = range * 0.3; // Чуть больше для надежности

    const yMin = effectiveMin - padding;
    const yMax = effectiveMax + padding;

    // Вычисляем красивый шаг для оси Y (целые числа)
    const yRange = yMax - yMin;
    let interval = 1;

    if (yRange <= 2) interval = 0.2;
    else if (yRange <= 5) interval = 0.5;
    else if (yRange <= 10) interval = 1;
    else if (yRange <= 20) interval = 2;
    else if (yRange <= 50) interval = 5;
    else if (yRange <= 100) interval = 10;
    else interval = 20;

    // Создаем данные с цветами
    const seriesData = filteredMeasurements.map((m, index) => {
      let color = '#F39C12';

      if (index > 0) {
        const prevValue = filteredMeasurements[index - 1].value;
        const currentParam = parameters.find(
          (p) => p.parameter_name === selectedParameter,
        );
        const trackingType = currentParam?.tracking_type || 'loss';

        if (m.value > prevValue) {
          color = trackingType === 'loss' ? '#E74C3C' : '#27AE60';
        } else if (m.value < prevValue) {
          color = trackingType === 'loss' ? '#27AE60' : '#E74C3C';
        }
      }

      return {
        value: [m.date, m.value],
        itemStyle: {
          color: color,
          borderColor: '#ffffff',
          borderWidth: 2,
        },
      };
    });

    // Конфигурация графика
    const option = {
      backgroundColor: '#fafafa',

      // Тултип с красивым отображением
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'white',
        borderColor: '#e0e0e0',
        borderWidth: 1,
        borderRadius: 8,
        padding: [12, 16],
        shadowBlur: 10,
        shadowColor: 'rgba(0,0,0,0.1)',
        textStyle: {
          color: '#2c3e50',
          fontSize: 13,
          fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
        },
        formatter: (params) => {
          if (!params || params.length === 0) return '';

          const data = params[0];
          const date = new Date(data.value[0]);
          const formattedDate = date.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          });
          const dayOfWeek = date.toLocaleDateString('ru-RU', {
            weekday: 'long',
          });

          return `
            <div style="min-width: 140px;">
              <div style="font-size: 11px; color: #7f8c8d; margin-bottom: 4px;">
                ${dayOfWeek}
              </div>
              <div style="font-weight: 600; margin-bottom: 8px; color: #2c3e50; font-size: 14px;">
                ${formattedDate}
              </div>
              <div style="display: flex; align-items: baseline; gap: 8px;">
                <span style="font-size: 11px; color: #7f8c8d;">Значение:</span>
                <span style="color: ${data.color}; font-size: 20px; font-weight: 700;">
                  ${data.value[1]}
                </span>
              </div>
              ${
                currentGoal
                  ? `
                <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #f0f0f0; font-size: 11px; color: #7f8c8d;">
                  До цели: ${Math.abs(data.value[1] - currentGoal.target_value).toFixed(1)}
                </div>
              `
                  : ''
              }
            </div>
          `;
        },
        // Дополнительно: показывать цель в тултипе
        extraCssText: 'max-width: 250px;',
      },

      // Интерактивная ось при наведении
      axisPointer: {
        show: true,
        link: [{ xAxisIndex: 'all' }],
        label: {
          show: false, // Скрываем стандартные метки, у нас свой тултип
        },
        lineStyle: {
          color: 'rgba(52, 152, 219, 0.15)',
          width: 1,
          type: 'dashed',
        },
        crossStyle: {
          color: 'rgba(52, 152, 219, 0.1)',
          width: 1,
          type: 'dashed',
        },
      },

      // Сетка
      grid: {
        top: 40,
        right: 30,
        bottom: 40,
        left: 55,
        containLabel: false,
      },

      // DataZoom для навигации по графику
      dataZoom: [
        // Внутренний зум (свайпы, жесты) — работает всегда
        {
          type: 'inside',
          xAxisIndex: 0,
          start:
            filteredMeasurements.length > 6
              ? Math.max(
                  0,
                  ((filteredMeasurements.length - 6) /
                    filteredMeasurements.length) *
                    100,
                )
              : 0, // Если > 6 записей, показываем последние 6
          end: 100,
          throttle: 50,
          zoomOnMouseWheel: false,
          moveOnMouseMove: true,
          moveOnMouseWheel: false,
          minValueSpan: 2,
          maxValueSpan: filteredMeasurements.length, // Максимум все записи
          zoomLock: false,
        },
        // Видимый слайдер — только когда записей > 6
        {
          type: 'slider',
          xAxisIndex: 0,
          start:
            filteredMeasurements.length > 6
              ? Math.max(
                  0,
                  ((filteredMeasurements.length - 6) /
                    filteredMeasurements.length) *
                    100,
                )
              : 0,
          end: 100,
          height: 24,
          bottom: 0,
          show: filteredMeasurements.length > 6,
          showDetail: false,
          showDataShadow: false,
          borderColor: 'transparent',
          backgroundColor: 'transparent',
          fillerColor: 'rgba(52, 152, 219, 0.12)',
          borderRadius: 12,
          handleStyle: {
            color: '#3498db',
            width: 28,
            height: 20,
            borderRadius: 10,
            borderColor: 'white',
            borderWidth: 2,
            shadowBlur: 4,
            shadowColor: 'rgba(0,0,0,0.2)',
          },
          moveHandleStyle: {
            color: '#2980b9',
          },
          emphasis: {
            handleStyle: {
              width: 32,
              height: 24,
            },
          },
          textStyle: {
            color: '#95a5a6',
            fontSize: 9,
          },
        },
      ],

      // Ось X (даты) - показываем только реальные даты измерений
      xAxis: {
        type: 'category',
        data: dates,
        boundaryGap: true,

        // ВАЖНО для dataZoom:
        axisLabel: {
          color: '#7f8c8d',
          fontSize: 11,
          fontWeight: 400,
          margin: 8,
          formatter: (value) => {
            const date = new Date(value);
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            return `${day}.${month}`;
          },
          interval: 'auto', // Автоматический интервал меток
          showMaxLabel: true, // Всегда показывать последнюю метку
          showMinLabel: true, // Всегда показывать первую метку
          hideOverlap: true, // Скрывать перекрывающиеся метки ← ВАЖНО
        },
        splitLine: { show: false },
        // Добавляем отступы по краям
      },

      // Ось Y (значения) - красивые целые числа
      yAxis: {
        type: 'value',
        min: Math.floor(yMin / interval) * interval,
        max: Math.ceil(yMax / interval) * interval,
        interval: interval,
        axisLine: {
          show: true,
          lineStyle: {
            color: '#e0e0e0',
            width: 1,
          },
        },
        axisTick: {
          show: true,
          length: 4,
          lineStyle: { color: '#e0e0e0' },
        },
        axisLabel: {
          color: '#7f8c8d',
          fontSize: 11,
          fontWeight: 400,
          margin: 8,
          formatter: (value) => {
            // Показываем целые числа без десятых, если интервал >= 1
            if (interval >= 1) {
              return Math.round(value).toString();
            }
            return value.toFixed(1);
          },
        },
        splitLine: {
          show: true,
          lineStyle: {
            color: '#f5f5f5',
            type: 'dashed',
            width: 1,
          },
        },
        // Скрываем дополнительные метки
        minorTick: { show: false },
        minorSplitLine: { show: false },
      },

      // Данные
      series: [
        {
          type: 'line',
          data: seriesData,
          showSymbol: true,
          symbol: 'circle',
          symbolSize: 8,
          lineStyle: {
            width: 0, // Скрываем стандартную линию
            color: 'transparent',
          },
          smooth: false,
          animation: true,
          animationDuration: 800,
          animationEasing: 'cubicOut',

          // Линия цели
          markLine: currentGoal
            ? {
                silent: false,
                symbol: 'none',
                lineStyle: {
                  color: '#E67E22',
                  type: 'dashed',
                  width: 2,
                },
                label: {
                  show: true,
                  position: 'insideEndTop',
                  formatter: `Цель: ${currentGoal.target_value}`,
                  color: '#E67E22',
                  fontSize: 12,
                  fontWeight: 600,
                  backgroundColor: 'rgba(255, 255, 255, 0.85)',
                  padding: [4, 8],
                  borderRadius: 4,
                  distance: [10, 10],
                },
                emphasis: {
                  label: {
                    fontSize: 14,
                  },
                  lineStyle: {
                    width: 3,
                  },
                },
                data: [
                  {
                    yAxis: currentGoal.target_value,
                  },
                ],
              }
            : undefined,
        },
      ],
    };

    // Применяем опции
    chart.setOption(option, true);

    // Отрисовываем цветные линии с задержкой
    const timer = setTimeout(() => {
      drawColoredLineSegments(
        chart,
        filteredMeasurements,
        parameters,
        selectedParameter,
      );
    }, 200);

    // Обработчик ресайза
    const handleResize = () => {
      chart.resize();
      setTimeout(() => {
        drawColoredLineSegments(
          chart,
          filteredMeasurements,
          parameters,
          selectedParameter,
        );
      }, 200);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, [filteredMeasurements, currentGoal, parameters, selectedParameter]);

  // Очистка
  useEffect(() => {
    return () => {
      if (chartInstance.current) {
        chartInstance.current.dispose();
        chartInstance.current = null;
      }
    };
  }, []);

  const handleParameterChange = useCallback(
    (e) => {
      onParameterChange(e.target.value);
    },
    [onParameterChange],
  );

  if (!measurements || measurements.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon} role="img" aria-label="graph">
            📊
          </span>
          <h3 className={styles.emptyTitle}>Нет данных для отображения</h3>
          <p className={styles.emptyText}>
            Добавьте свои первые измерения, чтобы увидеть график
          </p>
          <button onClick={onAddMeasurement} className={styles.addButton}>
            + Добавить запись
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Выбор параметра */}
      <div className={styles.controls}>
        <select
          value={selectedParameter}
          onChange={handleParameterChange}
          className={styles.parameterSelect}
        >
          {parameters.map((param) => (
            <option key={param.id} value={param.parameter_name}>
              {param.parameter_name}
            </option>
          ))}
        </select>
      </div>

      {/* Фильтры времени */}
      <div className={styles.timeFilters}>
        <button
          className={`${styles.filterButton} ${timeFilter === '7days' ? styles.active : ''}`}
          onClick={() => setTimeFilter('7days')}
        >
          7 дней
        </button>
        <button
          className={`${styles.filterButton} ${timeFilter === '30days' ? styles.active : ''}`}
          onClick={() => setTimeFilter('30days')}
        >
          30 дней
        </button>
        <button
          className={`${styles.filterButton} ${timeFilter === 'all' ? styles.active : ''}`}
          onClick={() => setTimeFilter('all')}
        >
          Всё время
        </button>
        <button
          className={`${styles.filterButton} ${timeFilter === 'custom' ? styles.active : ''}`}
          onClick={() => setTimeFilter('custom')}
        >
          Период
        </button>
      </div>

      {/* Произвольный период */}
      {timeFilter === 'custom' && (
        <div className={styles.customDates}>
          <input
            type="date"
            value={customStartDate}
            onChange={(e) => setCustomStartDate(e.target.value)}
            className={styles.dateInput}
            max={new Date().toISOString().split('T')[0]}
            aria-label="Начальная дата"
          />
          <span className={styles.dateSeparator}>—</span>
          <input
            type="date"
            value={customEndDate}
            onChange={(e) => setCustomEndDate(e.target.value)}
            className={styles.dateInput}
            max={new Date().toISOString().split('T')[0]}
            aria-label="Конечная дата"
          />
        </div>
      )}

      {/* График */}
      {filteredMeasurements.length > 0 ? (
        <div className={styles.chartContainer}>
          <div ref={chartRef} className={styles.chartWrapper} />
        </div>
      ) : (
        <div className={styles.noData}>
          <p>Нет данных за выбранный период</p>
        </div>
      )}

      {/* Кнопка статистики */}
      <button
        className={styles.statsToggle}
        onClick={() => setShowStats(!showStats)}
      >
        {showStats ? 'Скрыть статистику ▲' : 'Показать статистику ▼'}
      </button>

      {/* Статистика */}
      {showStats && filteredMeasurements.length > 0 && (
        <div className={styles.statistics}>
          <div className={styles.statGrid}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Записей</span>
              <span className={styles.statValue}>{statistics.count}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Среднее</span>
              <span className={styles.statValue}>{statistics.average}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Минимум</span>
              <span className={`${styles.statValue} ${styles.green}`}>
                {statistics.min}
              </span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Максимум</span>
              <span className={`${styles.statValue} ${styles.red}`}>
                {statistics.max}
              </span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Начало</span>
              <span className={styles.statValue}>{statistics.firstValue}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Конец</span>
              <span className={styles.statValue}>{statistics.lastValue}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Изменение</span>
              <span
                className={`${styles.statValue} ${
                  statistics.absoluteChange > 0 ? styles.red : styles.green
                }`}
              >
                {statistics.absoluteChange > 0 ? '+' : ''}
                {statistics.absoluteChange}
              </span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>В %</span>
              <span
                className={`${styles.statValue} ${
                  statistics.percentChange > 0 ? styles.red : styles.green
                }`}
              >
                {statistics.percentChange > 0 ? '+' : ''}
                {statistics.percentChange}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Легенда */}
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <span
            className={styles.legendColor}
            style={{ background: '#E74C3C' }}
          ></span>
          <span className={styles.legendText}>Рост</span>
        </div>
        <div className={styles.legendItem}>
          <span
            className={styles.legendColor}
            style={{ background: '#27AE60' }}
          ></span>
          <span className={styles.legendText}>Снижение</span>
        </div>
        <div className={styles.legendItem}>
          <span
            className={styles.legendColor}
            style={{ background: '#F39C12' }}
          ></span>
          <span className={styles.legendText}>Без изменений</span>
        </div>
      </div>
    </div>
  );
}

export default ChartView;
