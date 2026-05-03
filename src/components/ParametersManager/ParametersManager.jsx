// src/components/ParametersManager/ParametersManager.jsx
import { useState, useCallback } from 'react';
import styles from './ParametersManager.module.css';

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
  const [expandedParams, setExpandedParams] = useState({});

  // Доступные единицы измерения
  const units = [
    { value: 'kg', label: 'Килограммы (кг)' },
    { value: 'cm', label: 'Сантиметры (см)' },
    { value: 'l', label: 'Литры (л)' },
  ];

  // Переключение раскрытия карточки
  const toggleExpand = useCallback((paramId) => {
    setExpandedParams((prev) => ({
      ...prev,
      [paramId]: !prev[paramId],
    }));
  }, []);

  // Обработчик добавления параметра
  const handleAddParameter = useCallback(
    async (e) => {
      e.preventDefault();
      setError('');
      setSuccessMessage('');

      if (!newParamName.trim()) {
        setError('Введите название параметра');
        return;
      }

      if (newParamName.trim().length < 2) {
        setError('Название должно содержать минимум 2 символа');
        return;
      }

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
        setSuccessMessage(
          result.reactivated ? 'Параметр восстановлен!' : 'Параметр добавлен!',
        );
        setNewParamName('');
        setNewParamUnit('kg');
        setNewParamTracking('loss');
        setShowAddForm(false);
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
      if (parameter.parameter_name === 'вес') {
        alert('Параметр "вес" нельзя удалить.');
        return;
      }

      const confirmMessage = `Удалить параметр "${parameter.parameter_name}" навсегда?\n\nБудут удалены все измерения и цели для этого параметра.`;

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
      await onUpdateTrackingType(parameterId, newType);
    },
    [onUpdateTrackingType],
  );

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

      {successMessage && <div className={styles.success}>{successMessage}</div>}

      {!showAddForm && (
        <button
          onClick={() => setShowAddForm(true)}
          className={styles.addButton}
        >
          + Добавить параметр
        </button>
      )}

      {showAddForm && (
        <div className={styles.formContainer}>
          <h3 className={styles.formTitle}>Новый параметр</h3>

          {error && <div className={styles.error}>{error}</div>}

          <form onSubmit={handleAddParameter} className={styles.form}>
            <div className={styles.field}>
              <label className={styles.label}>Название</label>
              <input
                type="text"
                value={newParamName}
                onChange={(e) => setNewParamName(e.target.value)}
                className={styles.input}
                placeholder="Например: бицепс, талия"
                required
                maxLength={50}
                autoFocus
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
                    {unit.label}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Цель отслеживания</label>
              <div className={styles.trackingButtons}>
                <button
                  type="button"
                  className={`${styles.trackingButton} ${newParamTracking === 'loss' ? styles.active : ''}`}
                  onClick={() => setNewParamTracking('loss')}
                >
                  <span className={styles.trackingLabel}>📉 Снижение</span>
                  <span className={styles.trackingDesc}>
                    ↓ зелёный (хорошо), ↑ красный (плохо)
                  </span>
                </button>
                <button
                  type="button"
                  className={`${styles.trackingButton} ${newParamTracking === 'gain' ? styles.active : ''}`}
                  onClick={() => setNewParamTracking('gain')}
                >
                  <span className={styles.trackingLabel}>📈 Набор</span>
                  <span className={styles.trackingDesc}>
                    ↑ зелёный (хорошо), ↓ красный (плохо)
                  </span>
                </button>
              </div>
            </div>

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

      <div className={styles.parametersList}>
        {parameters.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Нет дополнительных параметров</p>
          </div>
        ) : (
          parameters.map((param) => {
            const isExpanded = expandedParams[param.id] || false;

            return (
              <div key={param.id} className={styles.parameterCard}>
                {/* Заголовок карточки (всегда видимый) */}
                <div
                  className={styles.paramHeader}
                  onClick={() => toggleExpand(param.id)}
                >
                  <div className={styles.paramInfo}>
                    <span className={styles.paramName}>
                      {param.parameter_name}
                    </span>
                    <span className={styles.paramUnit}>{param.unit}</span>
                    {param.parameter_name === 'вес' && (
                      <span className={styles.paramDefault}>системный</span>
                    )}
                  </div>

                  <div className={styles.paramActions}>
                    <span className={styles.expandIcon}>
                      {isExpanded ? '▼' : '▶'}
                    </span>
                    {param.parameter_name !== 'вес' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteParameter(param);
                        }}
                        className={styles.deleteButton}
                        title="Удалить параметр"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Раскрывающаяся часть */}
                {isExpanded && (
                  <div className={styles.paramDetails}>
                    {/* Цель отслеживания */}
                    <div className={styles.trackingToggle}>
                      <span className={styles.toggleLabel}>Цель:</span>
                      <div className={styles.toggleButtons}>
                        <button
                          className={`${styles.toggleButton} ${param.tracking_type === 'loss' ? styles.toggleActive : ''}`}
                          onClick={() =>
                            handleTrackingTypeChange(param.id, 'loss')
                          }
                        >
                          📉 Снижение
                        </button>
                        <button
                          className={`${styles.toggleButton} ${param.tracking_type === 'gain' ? styles.toggleActive : ''}`}
                          onClick={() =>
                            handleTrackingTypeChange(param.id, 'gain')
                          }
                        >
                          📈 Набор
                        </button>
                      </div>
                    </div>

                    {/* Пояснение цветов */}
                    <div className={styles.colorLogic}>
                      {param.tracking_type === 'loss' ? (
                        <div className={styles.colorExplanation}>
                          <div className={styles.colorRow}>
                            <span
                              className={styles.colorDot}
                              style={{ background: '#27AE60' }}
                            ></span>
                            <span>Снижение = хорошо (зелёный)</span>
                          </div>
                          <div className={styles.colorRow}>
                            <span
                              className={styles.colorDot}
                              style={{ background: '#E74C3C' }}
                            ></span>
                            <span>Рост = плохо (красный)</span>
                          </div>
                          <div className={styles.colorRow}>
                            <span
                              className={styles.colorDot}
                              style={{ background: '#F39C12' }}
                            ></span>
                            <span>Без изменений (жёлтый)</span>
                          </div>
                        </div>
                      ) : (
                        <div className={styles.colorExplanation}>
                          <div className={styles.colorRow}>
                            <span
                              className={styles.colorDot}
                              style={{ background: '#27AE60' }}
                            ></span>
                            <span>Рост = хорошо (зелёный)</span>
                          </div>
                          <div className={styles.colorRow}>
                            <span
                              className={styles.colorDot}
                              style={{ background: '#E74C3C' }}
                            ></span>
                            <span>Снижение = плохо (красный)</span>
                          </div>
                          <div className={styles.colorRow}>
                            <span
                              className={styles.colorDot}
                              style={{ background: '#F39C12' }}
                            ></span>
                            <span>Без изменений (жёлтый)</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default ParametersManager;
