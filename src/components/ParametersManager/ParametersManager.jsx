// src/components/ParametersManager/ParametersManager.jsx
import { useState, useCallback } from 'react';
import styles from './ParametersManager.module.css';

/**
 * Компонент для управления параметрами измерений
 */
function ParametersManager({
  parameters = [],
  loading = false,
  onAddParameter,
  onDeleteParameter,
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newParamName, setNewParamName] = useState('');
  const [newParamUnit, setNewParamUnit] = useState('kg');
  const [error, setError] = useState('');

  // Доступные единицы измерения
  const units = [
    { value: 'kg', label: 'Килограммы (кг)' },
    { value: 'cm', label: 'Сантиметры (см)' },
    { value: 'l', label: 'Литры (л)' },
  ];

  // Обработчик добавления параметра
  const handleAddParameter = useCallback(
    async (e) => {
      e.preventDefault();
      setError('');

      // Валидация
      if (!newParamName.trim()) {
        setError('Введите название параметра');
        return;
      }

      // Проверка на уникальность
      if (
        parameters.some(
          (p) =>
            p.parameter_name.toLowerCase() ===
            newParamName.trim().toLowerCase(),
        )
      ) {
        setError('Параметр с таким названием уже существует');
        return;
      }

      const result = await onAddParameter(
        newParamName.trim().toLowerCase(),
        newParamUnit,
      );

      if (result.success) {
        setNewParamName('');
        setNewParamUnit('kg');
        setShowAddForm(false);
      } else {
        setError(result.error || 'Ошибка при добавлении параметра');
      }
    },
    [newParamName, newParamUnit, parameters, onAddParameter],
  );

  // Обработчик удаления параметра
  const handleDeleteParameter = useCallback(
    async (parameter) => {
      // Защита от удаления параметра "вес"
      if (parameter.parameter_name === 'вес') {
        alert('Параметр "вес" нельзя удалить');
        return;
      }

      if (
        window.confirm(
          `Вы уверены, что хотите удалить параметр "${parameter.parameter_name}"? Все связанные измерения будут удалены.`,
        )
      ) {
        await onDeleteParameter(parameter.id);
      }
    },
    [onDeleteParameter],
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
        Создавайте собственные параметры для отслеживания. Параметр "вес"
        создается автоматически и не может быть удален.
      </p>

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
            <div className={styles.field}>
              <label className={styles.label}>Название параметра</label>
              <input
                type="text"
                value={newParamName}
                onChange={(e) => setNewParamName(e.target.value)}
                className={styles.input}
                placeholder="Например: бицепс, талия"
                required
              />
            </div>

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
                    {unit.value}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.formActions}>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
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
            <p>Нет доступных параметров</p>
          </div>
        ) : (
          parameters.map((param) => (
            <div key={param.id} className={styles.parameterChip}>
              <div className={styles.chipInfo}>
                <span className={styles.chipName}>{param.parameter_name}</span>
                <span className={styles.chipUnit}>{param.unit}</span>
                {param.parameter_name === 'вес' && (
                  <span className={styles.chipDefault}>По умолчанию</span>
                )}
              </div>
              {param.parameter_name !== 'вес' && (
                <button
                  onClick={() => handleDeleteParameter(param)}
                  className={styles.deleteChipButton}
                  title="Удалить параметр"
                >
                  ✕
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Информация о единицах измерения */}
      <div className={styles.infoBlock}>
        <h4 className={styles.infoTitle}>Доступные единицы измерения:</h4>
        <ul className={styles.infoList}>
          <li>
            <strong>kg</strong> - килограммы (шаг 0.1 кг)
          </li>
          <li>
            <strong>cm</strong> - сантиметры (шаг 0.1 см)
          </li>
          <li>
            <strong>l</strong> - литры (шаг 0.1 л)
          </li>
        </ul>
      </div>
    </div>
  );
}

export default ParametersManager;
