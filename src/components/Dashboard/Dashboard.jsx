// src/components/Dashboard/Dashboard.jsx
import { useState, useCallback } from 'react';
import ChartView from '../ChartView/ChartView';
import HistoryView from '../HistoryView/HistoryView';
import GoalsView from '../GoalsView/GoalsView';
import ParametersManager from '../ParametersManager/ParametersManager';
import AddMeasurement from '../AddMeasurement/AddMeasurement';
import { useMeasurements } from '../../hooks/useMeasurements';
import { useParameters } from '../../hooks/useParameters';
import { useGoals } from '../../hooks/useGoals';
import styles from './Dashboard.module.css';

function Dashboard({ session, onLogout }) {
  const [activeTab, setActiveTab] = useState('chart');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedParameter, setSelectedParameter] = useState('вес');

  // Состояние для запоминания последнего использованного параметра
  const [lastUsedParameter, setLastUsedParameter] = useState('вес');

  // Инициализация хуков
  const {
    measurements,
    loading: measurementsLoading,
    error: measurementsError,
    addMeasurement,
    updateMeasurement,
    deleteMeasurement,
    fetchMeasurements,
  } = useMeasurements(session.user.id);

  const {
    parameters,
    loading: parametersLoading,
    addParameter,
    updateTrackingType,
    deleteParameter,
  } = useParameters(session.user.id);

  const {
    goals,
    loading: goalsLoading,
    addGoal,
    updateGoal,
    deleteGoal,
  } = useGoals(session.user.id);

  // Обработчик добавления измерения с запоминанием параметра
  const handleAddMeasurement = useCallback(
    async (measurementData) => {
      const result = await addMeasurement(measurementData);
      if (result.success) {
        // Запоминаем последний использованный параметр
        setLastUsedParameter(measurementData.parameter);
        setShowAddModal(false);
      }
      return result;
    },
    [addMeasurement],
  );

  // Обработчик обновления измерения
  const handleUpdateMeasurement = useCallback(
    async (id, updates) => {
      const result = await updateMeasurement(id, updates);
      if (result.success) {
        await fetchMeasurements();
      }
      return result;
    },
    [updateMeasurement, fetchMeasurements],
  );

  // Обработчик удаления измерения
  const handleDeleteMeasurement = useCallback(
    async (id) => {
      const result = await deleteMeasurement(id);
      if (result.success) {
        await fetchMeasurements();
      }
      return result;
    },
    [deleteMeasurement, fetchMeasurements],
  );

  // Обработчик добавления параметра
  const handleAddParameter = useCallback(
    async (name, unit, trackingType) => {
      return await addParameter(name, unit, trackingType);
    },
    [addParameter],
  );

  // Обработчик обновления типа отслеживания
  const handleUpdateTrackingType = useCallback(
    async (parameterId, trackingType) => {
      const result = await updateTrackingType(parameterId, trackingType);
      if (result.success) {
        await fetchMeasurements();
      }
      return result;
    },
    [updateTrackingType, fetchMeasurements],
  );

  // Обработчик удаления параметра
  const handleDeleteParameter = useCallback(
    async (id) => {
      const result = await deleteParameter(id);
      if (result.success) {
        // Если удалили текущий выбранный параметр, переключаемся на "вес"
        const deletedParam = parameters.find((p) => p.id === id);
        if (deletedParam) {
          if (deletedParam.parameter_name === selectedParameter) {
            setSelectedParameter('вес');
          }
          if (deletedParam.parameter_name === lastUsedParameter) {
            setLastUsedParameter('вес');
          }
        }
        await fetchMeasurements();
      }
      return result;
    },
    [
      deleteParameter,
      fetchMeasurements,
      parameters,
      selectedParameter,
      lastUsedParameter,
    ],
  );

  // Обработчик добавления цели
  const handleAddGoal = useCallback(
    async (goalData) => {
      return await addGoal(goalData);
    },
    [addGoal],
  );

  // Обработчик обновления цели
  const handleUpdateGoal = useCallback(
    async (goalId, updates) => {
      return await updateGoal(goalId, updates);
    },
    [updateGoal],
  );

  // Обработчик удаления цели
  const handleDeleteGoal = useCallback(
    async (goalId) => {
      return await deleteGoal(goalId);
    },
    [deleteGoal],
  );

  // Обработчик открытия модального окна
  const handleOpenAddModal = useCallback(() => {
    setShowAddModal(true);
  }, []);

  // Обработчик закрытия модального окна
  const handleCloseAddModal = useCallback(() => {
    setShowAddModal(false);
  }, []);

  // Рендер содержимого в зависимости от активной вкладки
  const renderContent = () => {
    if (measurementsError) {
      return (
        <div className={styles.errorContainer}>
          <p className={styles.errorMessage}>
            Ошибка загрузки данных: {measurementsError}
          </p>
          <button onClick={fetchMeasurements} className={styles.retryButton}>
            Повторить попытку
          </button>
        </div>
      );
    }

    switch (activeTab) {
      case 'chart':
        return (
          <ChartView
            measurements={measurements}
            parameters={parameters}
            goals={goals}
            selectedParameter={selectedParameter}
            onParameterChange={setSelectedParameter}
            onAddMeasurement={handleOpenAddModal}
          />
        );
      case 'history':
        return (
          <HistoryView
            measurements={measurements}
            loading={measurementsLoading}
            onUpdateMeasurement={handleUpdateMeasurement}
            onDeleteMeasurement={handleDeleteMeasurement}
            onAddMeasurement={handleOpenAddModal}
          />
        );
      case 'goals':
        return (
          <GoalsView
            measurements={measurements}
            goals={goals}
            loading={goalsLoading}
            parameters={parameters}
            onAddGoal={handleAddGoal}
            onUpdateGoal={handleUpdateGoal}
            onDeleteGoal={handleDeleteGoal}
          />
        );
      case 'parameters':
        return (
          <ParametersManager
            parameters={parameters}
            loading={parametersLoading}
            onAddParameter={handleAddParameter}
            onUpdateTrackingType={handleUpdateTrackingType}
            onDeleteParameter={handleDeleteParameter}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className={styles.container}>
      {/* Заголовок */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Weight Tracker</h1>
          <div className={styles.userInfo}>
            <span className={styles.userEmail}>{session.user.email}</span>
            <button onClick={onLogout} className={styles.logoutButton}>
              Выйти
            </button>
          </div>
        </div>
      </header>

      {/* Контент */}
      <main className={styles.main}>{renderContent()}</main>

      {/* Навигация */}
      <nav className={styles.nav}>
        <button
          className={`${styles.navButton} ${activeTab === 'chart' ? styles.active : ''}`}
          onClick={() => setActiveTab('chart')}
        >
          📊 График
        </button>
        <button
          className={`${styles.navButton} ${activeTab === 'history' ? styles.active : ''}`}
          onClick={() => setActiveTab('history')}
        >
          📋 История
        </button>
        <button
          className={`${styles.navButton} ${activeTab === 'goals' ? styles.active : ''}`}
          onClick={() => setActiveTab('goals')}
        >
          🎯 Цели
        </button>
        <button
          className={`${styles.navButton} ${activeTab === 'parameters' ? styles.active : ''}`}
          onClick={() => setActiveTab('parameters')}
        >
          ⚙️ Параметры
        </button>
      </nav>

      {/* Кнопка добавления записи */}
      {(activeTab === 'chart' || activeTab === 'history') && (
        <button className={styles.addButton} onClick={handleOpenAddModal}>
          + Добавить запись
        </button>
      )}

      {/* Модальное окно добавления измерения */}
      {showAddModal && (
        <AddMeasurement
          parameters={parameters}
          measurements={measurements}
          onAdd={handleAddMeasurement}
          onClose={handleCloseAddModal}
          defaultParameter={lastUsedParameter}
        />
      )}
    </div>
  );
}

export default Dashboard;
