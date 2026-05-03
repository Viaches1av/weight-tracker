// src/components/ParametersManager/ParametersManager.jsx
import { useState, useCallback } from 'react';
import styles from './ParametersManager.module.css';

/**
 * Компонент для управления параметрами измерений
 * Добавлена возможность выбора типа отслеживания
 */
function ParametersManager({
  parameters = [],
  loading = false,
  onAddParameter,
  onUpdateTrackingType,
  onDeleteParameter,
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newParamName, setNewParamName] = useState('');
  const [newParamUnit, setNewParamUnit] = useState('kg');
  const [newParamTracking, setNewParamTracking] = useState('loss');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Доступные единицы измерения
  const units = [
    { value: 'kg', label: 'Килограммы (кг)' },
    { value: 'cm', label: 'Сантиметры (см)' },
    { value: 'l', label: 'Литры (л)' },
  ];

  // Типы отслеживания
  const trackingTypes = [
    {
      value: 'loss',
      label: '📉 Снижение',
      description: '↓ зелёный (хорошо), ↑ красный (плохо)',
      color: '#27ae60',
    },
    {
      value: 'gain',
      label: '📈 Набор',
      description: '↑ зелёный (хорошо), ↓ красный (плохо)',
      color: '#27ae60',
    },
  ];

  // Обработчик добавления параметра
  const handleAddParameter = useCallback(
    async (e) => {
      e.preventDefault();
      setError('');
      setSuccessMessage('');

      // Валидация
      if (!newParamName.trim()) {
        setError('Введите название параметра');
        return;
      }

      // Проверка на длину
      if (newParamName.trim().length < 2) {
        setError('Название должно содержать минимум 2 символа');
        return;
      }

      // Проверка на спецсимволы
      if (!/^[а-яёa-z0-9\s]+$/i.test(newParamName.trim())) {
        setError('Название может содержать только буквы, цифры и пробелы');
        return;
      }

      const result = await onAddParameter(
        newParamName.trim(),
        newParamUnit,
        newParamTracking,
      );

      if (result.success) {
        if (result.reactivated) {
          setSuccessMessage('Параметр успешно восстановлен!');
        } else {
          setSuccessMessage('Параметр успешно добавлен!');
        }
        setNewParamName('');
        setNewParamUnit('kg');
        setNewParamTracking('loss');
        setShowAddForm(false);

        // Скрываем сообщение через 3 секунды
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(result.error || 'Ошибка при добавлении параметра');
      }
    },
    [newParamName, newParamUnit, newParamTracking, onAddParameter],
  );

  // Обработчик удаления параметра
  const handleDeleteParameter = useCallback(
    async (parameter) => {
      // Защита от удаления параметра "вес"
      if (parameter.parameter_name === 'вес') {
        alert('Параметр "вес" нельзя удалить. Это основной параметр системы.');
        return;
      }

      const confirmMessage = [
        `Вы действительно хотите удалить параметр "${parameter.parameter_name}"?`,
        '',
        'Будет удалено:',
        '• Все измерения этого параметра',
        '• Цель для этого параметра (если есть)',
        '• Сам параметр из списка',
        '',
        'Это действие нельзя отменить!',
      ].join('\n');

      if (window.confirm(confirmMessage)) {
        const result = await onDeleteParameter(parameter.id);
        if (result.success) {
          setSuccessMessage(`Параметр "${parameter.parameter_name}" удалён`);
          setTimeout(() => setSuccessMessage(''), 3000);
        }
      }
    },
    [onDeleteParameter],
  );

  // Обработчик изменения типа отслеживания
  const handleTrackingTypeChange = useCallback(
    async (parameterId, newType) => {
      const result = await onUpdateTrackingType(parameterId, newType);
      if (result.success) {
        setSuccessMessage('Тип отслеживания обновлён');
        setTimeout(() => setSuccessMessage(''), 2000);
      }
    },
    [onUpdateTrackingType],
  );

  // Если загрузка
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>Загрузка параметров...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Управление параметрами</h2>
      <p className={styles.description}>
        Создавайте собственные параметры для отслеживания. Для каждого параметра
        можно выбрать цель: снижение или набор.
      </p>

      {/* Сообщение об успехе */}
      {successMessage && <div className={styles.success}>{successMessage}</div>}

      {/* Кнопка добавления */}
      {!showAddForm && (
        <button
          onClick={() => setShowAddForm(true)}
          className={styles.addButton}
        >
          + Добавить параметр
        </button>
      )}

      {/* Форма добавления */}
      {showAddForm && (
        <div className={styles.formContainer}>
          <h3 className={styles.formTitle}>Новый параметр</h3>

          {error && <div className={styles.error}>{error}</div>}

          <form onSubmit={handleAddParameter} className={styles.form}>
            {/* Название параметра */}
            <div className={styles.field}>
              <label className={styles.label}>Название параметра</label>
              <input
                type="text"
                value={newParamName}
                onChange={(e) => setNewParamName(e.target.value)}
                className={styles.input}
                placeholder="Например: бицепс, талия, бедро"
                required
                maxLength={50}
                autoFocus
              />
              <span className={styles.hint}>Только буквы, цифры и пробелы</span>
            </div>

            {/* Единица измерения */}
            <div className={styles.field}>
              <label className={styles.label}>Единица измерения</label>
              <div className={styles.unitButtons}>
                {units.map((unit) => (
                  <button
                    key={unit.value}
                    type="button"
                    className={`${styles.unitButton} ${newParamUnit === unit.value ? styles.active : ''}`}
                    onClick={() => setNewParamUnit(unit.value)}
                  >
                    {unit.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Тип отслеживания */}
            <div className={styles.field}>
              <label className={styles.label}>Цель отслеживания</label>
              <div className={styles.trackingButtons}>
                {trackingTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    className={`${styles.trackingButton} ${newParamTracking === type.value ? styles.active : ''}`}
                    onClick={() => setNewParamTracking(type.value)}
                  >
                    <span className={styles.trackingLabel}>{type.label}</span>
                    <span className={styles.trackingDesc}>
                      {type.description}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Кнопки */}
            <div className={styles.formActions}>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setError('');
                }}
                className={styles.cancelButton}
              >
                Отмена
              </button>
              <button type="submit" className={styles.saveButton}>
                Добавить
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Список параметров */}
      <div className={styles.parametersList}>
        {parameters.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Нет дополнительных параметров</p>
            <p className={styles.emptyHint}>
              Параметр "вес" создаётся автоматически при регистрации
            </p>
          </div>
        ) : (
          parameters.map((param) => (
            <div key={param.id} className={styles.parameterCard}>
              <div className={styles.paramHeader}>
                <div className={styles.paramInfo}>
                  <span className={styles.paramName}>
                    {param.parameter_name}
                  </span>
                  <span className={styles.paramUnit}>{param.unit}</span>
                  {param.parameter_name === 'вес' && (
                    <span className={styles.paramDefault}>системный</span>
                  )}
                </div>

                {/* Кнопка удаления (кроме веса) */}
                {param.parameter_name !== 'вес' && (
                  <button
                    onClick={() => handleDeleteParameter(param)}
                    className={styles.deleteButton}
                    title="Удалить параметр"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Переключатель типа отслеживания */}
              <div className={styles.trackingToggle}>
                <span className={styles.toggleLabel}>Цель:</span>
                <div className={styles.toggleButtons}>
                  <button
                    className={`${styles.toggleButton} ${param.tracking_type === 'loss' ? styles.toggleActive : ''}`}
                    onClick={() => handleTrackingTypeChange(param.id, 'loss')}
                  >
                    📉 Снижение
                  </button>
                  <button
                    className={`${styles.toggleButton} ${param.tracking_type === 'gain' ? styles.toggleActive : ''}`}
                    onClick={() => handleTrackingTypeChange(param.id, 'gain')}
                  >
                    📈 Набор
                  </button>
                </div>
              </div>

              {/* Пояснение текущей логики цветов */}
              <div className={styles.colorLogic}>
                {param.tracking_type === 'loss' ? (
                  <span>
                    <span className={styles.good}>↓ Зелёный</span> — хорошо
                    (снижение), <span className={styles.bad}>↑ Красный</span> —
                    плохо (рост)
                  </span>
                ) : (
                  <span>
                    <span className={styles.good}>↑ Зелёный</span> — хорошо
                    (набор), <span className={styles.bad}>↓ Красный</span> —
                    плохо (снижение)
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Информация */}
      <div className={styles.infoBlock}>
        <h4 className={styles.infoTitle}>Как работают цвета на графике?</h4>
        <ul className={styles.infoList}>
          <li>
            <strong>Снижение:</strong> зелёная линия вниз (прогресс), красная
            вверх (откат)
          </li>
          <li>
            <strong>Набор:</strong> зелёная линия вверх (прогресс), красная вниз
            (откат)
          </li>
          <li>
            <strong>Жёлтый:</strong> значение не изменилось
          </li>
        </ul>
      </div>
    </div>
  );
}

export default ParametersManager;
