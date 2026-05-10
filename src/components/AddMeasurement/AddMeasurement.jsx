// src/components/AddMeasurement/AddMeasurement.jsx
import { useState, useMemo } from 'react';
import styles from './AddMeasurement.module.css';

/**
 * Модальное окно для добавления/редактирования измерения
 * Теперь с поддержкой defaultParameter
 */
function AddMeasurement({
  parameters = [],
  measurements = [],
  onAdd,
  onClose,
  editData = null,
  defaultParameter = 'вес',
}) {
  // Используем defaultParameter если нет editData
  const [selectedParameter, setSelectedParameter] = useState(
    editData ? editData.parameter : defaultParameter,
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
    if (editData) return false;

    return measurements.some(
      (m) => m.parameter === selectedParameter && m.date === date,
    );
  }, [measurements, selectedParameter, date, editData]);

  // Максимальная дата - сегодня
  const maxDate = useMemo(() => {
    return new Date().toISOString().split('T')[0];
  }, []);

  // Шаг для числового поля
  const inputStep = useMemo(() => {
    return '0.1';
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
      // Если успех - форма закроется из Dashboard
    } catch (err) {
      setError(err.message || 'Неизвестная ошибка');
    } finally {
      setLoading(false);
    }
  };

  // Обработчик изменения значения с валидацией
  const handleValueChange = (e) => {
    const newValue = e.target.value;
    // Разрешаем только числа с точкой и не более 7 символов всего
    if (/^\d*\.?\d{0,1}$/.test(newValue) && newValue.length <= 7) {
      setValue(newValue);
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
              disabled={!!editData}
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
            {/* Подсказка, если параметр запомнен */}
            {!editData &&
              selectedParameter === defaultParameter &&
              selectedParameter !== 'вес' && (
                <span className={styles.hint}>
                  Использован последний выбранный параметр
                </span>
              )}
          </div>

          {/* Ввод значения */}
          <div className={styles.field}>
            <label className={styles.label}>
              Значение {currentParameter ? `(${currentParameter.unit})` : ''}
            </label>
            <div className={styles.valueInputWrapper}>
              <input
                type="number"
                value={value}
                onChange={handleValueChange}
                className={styles.input}
                step={inputStep}
                min="0"
                required
                placeholder={`0${currentParameter?.unit === 'kg' ? '.0' : ''}`}
                inputMode="decimal"
                autoFocus
              />
              {currentParameter && (
                <span className={styles.unitLabel}>
                  {currentParameter.unit}
                </span>
              )}
            </div>
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
