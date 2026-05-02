// src/components/HistoryView/HistoryView.jsx
import { useState, useMemo, useCallback } from 'react';
import AddMeasurement from '../AddMeasurement/AddMeasurement';
import styles from './HistoryView.module.css';

/**
 * Компонент для отображения истории записей
 */
function HistoryView({
  measurements = [],
  loading = false,
  onUpdateMeasurement,
  onDeleteMeasurement,
  onAddMeasurement,
}) {
  const [editData, setEditData] = useState(null);
  const [sortOrder, setSortOrder] = useState('desc');
  const [expandedParameter, setExpandedParameter] = useState(null);

  // Группировка измерений по параметрам
  const groupedMeasurements = useMemo(() => {
    if (!measurements || measurements.length === 0) return {};

    const groups = {};

    measurements.forEach((measurement) => {
      if (!groups[measurement.parameter]) {
        groups[measurement.parameter] = [];
      }
      groups[measurement.parameter].push(measurement);
    });

    // Сортируем внутри каждой группы
    Object.keys(groups).forEach((parameter) => {
      groups[parameter].sort((a, b) => {
        const comparison = new Date(b.date) - new Date(a.date);
        return sortOrder === 'desc' ? comparison : -comparison;
      });
    });

    return groups;
  }, [measurements, sortOrder]);

  // Обработчик редактирования
  const handleEdit = useCallback((measurement) => {
    setEditData(measurement);
  }, []);

  // Обработчик сохранения редактирования
  const handleSaveEdit = useCallback(
    async (editData) => {
      const result = await onUpdateMeasurement(editData.id, {
        date: editData.date,
        value: editData.value,
      });
      if (result.success) {
        setEditData(null);
      }
      return result;
    },
    [onUpdateMeasurement],
  );

  // Обработчик удаления
  const handleDelete = useCallback(
    async (id) => {
      if (window.confirm('Вы уверены, что хотите удалить эту запись?')) {
        await onDeleteMeasurement(id);
      }
    },
    [onDeleteMeasurement],
  );

  // Если идет загрузка
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>Загрузка данных...</p>
        </div>
      </div>
    );
  }

  // Если нет данных
  if (!measurements || measurements.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <p className={styles.emptyIcon}>📋</p>
          <h3 className={styles.emptyTitle}>История измерений пуста</h3>
          <p className={styles.emptyText}>
            Добавьте свои первые измерения, чтобы отслеживать прогресс
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Управление сортировкой */}
      <div className={styles.controls}>
        <button
          className={`${styles.sortButton} ${sortOrder === 'desc' ? styles.active : ''}`}
          onClick={() => setSortOrder('desc')}
        >
          Новые сначала
        </button>
        <button
          className={`${styles.sortButton} ${sortOrder === 'asc' ? styles.active : ''}`}
          onClick={() => setSortOrder('asc')}
        >
          Старые сначала
        </button>
      </div>

      {/* Группы измерений по параметрам */}
      {Object.entries(groupedMeasurements).map(([parameter, items]) => (
        <div key={parameter} className={styles.parameterGroup}>
          <button
            className={styles.parameterHeader}
            onClick={() =>
              setExpandedParameter(
                expandedParameter === parameter ? null : parameter,
              )
            }
          >
            <span className={styles.parameterName}>{parameter}</span>
            <span className={styles.parameterCount}>
              {items.length} записей
            </span>
            <span className={styles.expandIcon}>
              {expandedParameter === parameter ? '▼' : '▶'}
            </span>
          </button>

          {/* Список измерений для параметра */}
          {(expandedParameter === parameter ||
            Object.keys(groupedMeasurements).length === 1) && (
            <div className={styles.measurementsList}>
              {items.map((measurement) => (
                <div
                  key={measurement.id}
                  className={styles.measurementItem}
                  onClick={() => handleEdit(measurement)}
                >
                  <div className={styles.measurementInfo}>
                    <span className={styles.measurementDate}>
                      {new Date(measurement.date).toLocaleDateString('ru-RU')}
                    </span>
                    <span className={styles.measurementValue}>
                      {measurement.value}
                    </span>
                  </div>
                  <div className={styles.measurementActions}>
                    <button
                      className={styles.actionButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(measurement);
                      }}
                      title="Редактировать"
                    >
                      ✏️
                    </button>
                    <button
                      className={styles.actionButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(measurement.id);
                      }}
                      title="Удалить"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Модальное окно редактирования */}
      {editData && (
        <AddMeasurement
          measurements={measurements}
          editData={editData}
          onAdd={(data) => handleSaveEdit({ ...editData, ...data })}
          onClose={() => setEditData(null)}
        />
      )}
    </div>
  );
}

export default HistoryView;
