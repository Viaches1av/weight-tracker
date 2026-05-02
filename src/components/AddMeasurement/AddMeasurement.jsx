// src/components/AddMeasurement/AddMeasurement.jsx
import { useState, useMemo } from 'react';
import styles from './AddMeasurement.module.css';

/**
 * Модальное окно для добавления/редактирования измерения
 */
function AddMeasurement({
  parameters = [],
  measurements = [],
  onAdd,
  onClose,
  editData = null,
}) {
  const [selectedParameter, setSelectedParameter] = useState(
    editData ? editData.parameter : parameters[0]?.parameter_name || 'вес',
  );
  const [value, setValue] = useState(editData ? editData.value.toString() : '');
  const [date, setDate] = useState(
    editData ? editData.date : new Date().toISOString().split('T')[0],
  );
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Получаем текущий параметр для определения единицы измерения
  const currentParameter = useMemo(() => {
    return parameters.find((p) => p.parameter_name === selectedParameter);
  }, [parameters, selectedParameter]);

  // Проверка на дубликат записи
  const checkDuplicate = useMemo(() => {
    if (editData) return false; // При редактировании не проверяем

    return measurements.some(
      (m) => m.parameter === selectedParameter && m.date === date,
    );
  }, [measurements, selectedParameter, date, editData]);

  // Шаг для инпута в зависимости от единицы измерения
  const step = useMemo(() => {
    return '0.1';
  }, []);

  // Сегодняшняя дата для ограничения
  const maxDate = useMemo(() => {
    return new Date().toISOString().split('T')[0];
  }, []);

  // Обработчик отправки формы
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Валидация
    if (!selectedParameter) {
      setError('Выберите параметр');
      return;
    }

    if (!value || parseFloat(value) <= 0) {
      setError('Значение должно быть больше 0');
      return;
    }

    if (!date) {
      setError('Выберите дату');
      return;
    }

    if (new Date(date) > new Date()) {
      setError('Нельзя выбрать будущую дату');
      return;
    }

    if (checkDuplicate) {
      setError('Запись с таким параметром и датой уже существует');
      return;
    }

    setLoading(true);

    try {
      const result = await onAdd({
        parameter: selectedParameter,
        value: parseFloat(value),
        date: date,
      });

      if (!result.success) {
        setError(result.error || 'Ошибка при сохранении');
      }
    } catch (err) {
      setError(err.message || 'Неизвестная ошибка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2 className={styles.title}>
          {editData ? 'Редактировать запись' : 'Добавить запись'}
        </h2>

        {error && <div className={styles.error}>{error}</div>}
        {checkDuplicate && !error && (
          <div className={styles.warning}>
            Внимание: запись с таким параметром и датой уже существует
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Выбор параметра */}
          <div className={styles.field}>
            <label className={styles.label}>Параметр</label>
            <select
              value={selectedParameter}
              onChange={(e) => setSelectedParameter(e.target.value)}
              className={styles.select}
              disabled={!!editData} // При редактировании нельзя менять параметр
            >
              {parameters.length === 0 ? (
                <option value="">Нет доступных параметров</option>
              ) : (
                parameters.map((param) => (
                  <option key={param.id} value={param.parameter_name}>
                    {param.parameter_name} ({param.unit})
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Ввод значения */}
          <div className={styles.field}>
            <label className={styles.label}>
              Значение {currentParameter ? `(${currentParameter.unit})` : ''}
            </label>
            <input
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className={styles.input}
              step={step}
              min="0"
              required
              placeholder={`Значение в ${currentParameter?.unit || 'кг'}`}
            />
          </div>

          {/* Выбор даты */}
          <div className={styles.field}>
            <label className={styles.label}>Дата</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={styles.input}
              max={maxDate}
              required
            />
          </div>

          {/* Кнопки действий */}
          <div className={styles.actions}>
            <button
              type="button"
              onClick={onClose}
              className={styles.cancelButton}
              disabled={loading}
            >
              Отмена
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading}
            >
              {loading ? 'Сохранение...' : editData ? 'Обновить' : 'Добавить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddMeasurement;
