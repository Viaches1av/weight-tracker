// src/components/GoalsView/GoalsView.jsx
import { useState, useMemo, useCallback } from 'react';
import { calculateGoalProgress, isGoalAchieved } from '../../utils/statistics';
import styles from './GoalsView.module.css';

/**
 * Компонент для управления целями
 */
function GoalsView({
  measurements = [],
  goals = [],
  loading = false,
  parameters = [],
  onAddGoal,
  onUpdateGoal,
  onDeleteGoal,
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);

  // Форма добавления/редактирования
  const [formData, setFormData] = useState({
    parameter: parameters[0]?.parameter_name || 'вес',
    target_value: '',
    deadline: '',
  });
  const [formError, setFormError] = useState('');

  // Получение начального значения для параметра
  const getInitialValue = useCallback(
    (parameter) => {
      if (!measurements || measurements.length === 0) return null;

      const paramMeasurements = measurements
        .filter((m) => m.parameter === parameter)
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      return paramMeasurements.length > 0 ? paramMeasurements[0].value : null;
    },
    [measurements],
  );

  // Получение последнего значения для параметра
  const getLatestValue = useCallback(
    (parameter) => {
      if (!measurements || measurements.length === 0) return null;

      const paramMeasurements = measurements
        .filter((m) => m.parameter === parameter)
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      return paramMeasurements.length > 0 ? paramMeasurements[0].value : null;
    },
    [measurements],
  );

  // Получение измерений для цели
  const getGoalMeasurements = useCallback(
    (goal) => {
      if (!measurements || measurements.length === 0) return [];

      let filtered = measurements.filter((m) => m.parameter === goal.parameter);

      if (goal.deadline) {
        filtered = filtered.filter(
          (m) => new Date(m.date) <= new Date(goal.deadline),
        );
      }

      return filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
    },
    [measurements],
  );

  // Открытие формы добавления
  const handleAddClick = useCallback(() => {
    setFormData({
      parameter: parameters[0]?.parameter_name || 'вес',
      target_value: '',
      deadline: '',
    });
    setFormError('');
    setShowAddForm(true);
    setEditingGoal(null);
  }, [parameters]);

  // Открытие формы редактирования
  const handleEditClick = useCallback((goal) => {
    setFormData({
      parameter: goal.parameter,
      target_value: goal.target_value.toString(),
      deadline: goal.deadline || '',
    });
    setFormError('');
    setEditingGoal(goal);
    setShowAddForm(true);
  }, []);

  // Отправка формы
  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setFormError('');

      // Валидация
      if (!formData.parameter) {
        setFormError('Выберите параметр');
        return;
      }

      if (!formData.target_value || parseFloat(formData.target_value) <= 0) {
        setFormError('Целевое значение должно быть больше 0');
        return;
      }

      const initialValue = getInitialValue(formData.parameter);
      if (initialValue === null) {
        setFormError(
          'Нет измерений для этого параметра. Добавьте хотя бы одно измерение',
        );
        return;
      }

      try {
        let result;
        if (editingGoal) {
          result = await onUpdateGoal(editingGoal.id, {
            target_value: parseFloat(formData.target_value),
            deadline: formData.deadline || null,
          });
        } else {
          // Проверка на существующую цель для этого параметра
          const hasExistingGoal = goals.some(
            (g) => g.parameter === formData.parameter,
          );
          if (hasExistingGoal) {
            setFormError(
              'Цель для этого параметра уже существует. Удалите или измените существующую цель',
            );
            return;
          }

          result = await onAddGoal({
            parameter: formData.parameter,
            target_value: parseFloat(formData.target_value),
            deadline: formData.deadline || null,
          });
        }

        if (result.success) {
          setShowAddForm(false);
        } else {
          setFormError(result.error || 'Ошибка сохранения');
        }
      } catch (err) {
        setFormError(err.message || 'Неизвестная ошибка');
      }
    },
    [formData, editingGoal, goals, getInitialValue, onAddGoal, onUpdateGoal],
  );

  // Удаление цели
  const handleDelete = useCallback(
    async (goalId) => {
      if (window.confirm('Вы уверены, что хотите удалить эту цель?')) {
        await onDeleteGoal(goalId);
      }
    },
    [onDeleteGoal],
  );

  // Если загрузка
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>Загрузка целей...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Кнопка добавления цели */}
      {!showAddForm && (
        <button onClick={handleAddClick} className={styles.addButton}>
          + Добавить цель
        </button>
      )}

      {/* Форма добавления/редактирования */}
      {showAddForm && (
        <div className={styles.formContainer}>
          <h3 className={styles.formTitle}>
            {editingGoal ? 'Редактировать цель' : 'Новая цель'}
          </h3>

          {formError && <div className={styles.error}>{formError}</div>}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label className={styles.label}>Параметр</label>
              <select
                value={formData.parameter}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    parameter: e.target.value,
                  }))
                }
                className={styles.select}
                disabled={!!editingGoal}
              >
                {parameters.map((param) => (
                  <option key={param.id} value={param.parameter_name}>
                    {param.parameter_name}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Целевое значение</label>
              <input
                type="number"
                value={formData.target_value}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    target_value: e.target.value,
                  }))
                }
                className={styles.input}
                step="0.1"
                min="0"
                required
                placeholder="Введите целевое значение"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Дедлайн (опционально)</label>
              <input
                type="date"
                value={formData.deadline}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, deadline: e.target.value }))
                }
                className={styles.input}
                min={new Date().toISOString().split('T')[0]}
              />
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
                {editingGoal ? 'Обновить' : 'Создать'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Список целей */}
      {goals.length === 0 && !showAddForm ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyIcon}>🎯</p>
          <h3 className={styles.emptyTitle}>Нет целей</h3>
          <p className={styles.emptyText}>
            Установите цели для отслеживания прогресса
          </p>
        </div>
      ) : (
        <div className={styles.goalsList}>
          {goals.map((goal) => {
            const goalMeasurements = getGoalMeasurements(goal);
            const progress = calculateGoalProgress(goalMeasurements, goal);
            const achieved = isGoalAchieved(goalMeasurements, goal);
            const initialValue = getInitialValue(goal.parameter);
            const latestValue = getLatestValue(goal.parameter);

            return (
              <div
                key={goal.id}
                className={`${styles.goalCard} ${achieved ? styles.achieved : ''}`}
              >
                <div className={styles.goalHeader}>
                  <h4 className={styles.goalTitle}>{goal.parameter}</h4>
                  {achieved && (
                    <span className={styles.achievedBadge}>Достигнута! 🎉</span>
                  )}
                </div>

                <div className={styles.goalInfo}>
                  <div className={styles.goalTarget}>
                    Цель: <strong>{goal.target_value}</strong>
                  </div>
                  {goal.deadline && (
                    <div className={styles.goalDeadline}>
                      Дедлайн:{' '}
                      {new Date(goal.deadline).toLocaleDateString('ru-RU')}
                    </div>
                  )}
                </div>

                {/* Прогресс-бар */}
                {initialValue !== null && latestValue !== null && (
                  <div className={styles.progressSection}>
                    <div className={styles.progressBar}>
                      <div
                        className={styles.progressFill}
                        style={{ width: `${Math.min(100, progress)}%` }}
                      />
                    </div>
                    <div className={styles.progressValues}>
                      <span className={styles.initialValue}>
                        {initialValue}
                      </span>
                      <span className={styles.progressPercent}>
                        {Math.round(progress)}%
                        {progress > 100 && ' (перевыполнено)'}
                      </span>
                      <span className={styles.targetValue}>
                        {goal.target_value}
                      </span>
                    </div>
                    <div className={styles.currentValue}>
                      Текущее: {latestValue}
                    </div>
                  </div>
                )}

                {/* Кнопки действий */}
                <div className={styles.goalActions}>
                  <button
                    onClick={() => handleEditClick(goal)}
                    className={styles.actionButton}
                  >
                    ✏️ Изменить
                  </button>
                  <button
                    onClick={() => handleDelete(goal.id)}
                    className={`${styles.actionButton} ${styles.deleteButton}`}
                  >
                    🗑️ Удалить
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default GoalsView;
