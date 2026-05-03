// src/hooks/useParameters.js
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

/**
 * Хук для работы с параметрами
 * @param {string} userId - ID пользователя
 * @returns {Object} - данные и методы для работы с параметрами
 */
export const useParameters = (userId) => {
  const [parameters, setParameters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Загрузка параметров
  const fetchParameters = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('user_parameters')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('parameter_name');

      if (error) throw error;

      // Добавляем tracking_type по умолчанию, если его нет
      const normalizedData = (data || []).map((param) => ({
        ...param,
        tracking_type: param.tracking_type || 'loss',
      }));

      setParameters(normalizedData);
    } catch (err) {
      console.error('Ошибка загрузки параметров:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Добавление параметра
  const addParameter = useCallback(
    async (parameterName, unit, trackingType = 'loss') => {
      try {
        setError(null);

        // Проверяем, существует ли уже такой параметр
        const { data: existing } = await supabase
          .from('user_parameters')
          .select('id, is_active')
          .eq('user_id', userId)
          .eq('parameter_name', parameterName.toLowerCase())
          .single();

        if (existing) {
          // Если параметр существует, но неактивен - активируем его
          if (!existing.is_active) {
            const { data, error } = await supabase
              .from('user_parameters')
              .update({
                is_active: true,
                tracking_type: trackingType,
              })
              .eq('id', existing.id)
              .select()
              .single();

            if (error) throw error;

            setParameters((prev) => [...prev, data]);
            return { success: true, data, reactivated: true };
          }

          // Если активен - ошибка
          return {
            success: false,
            error: 'Параметр с таким названием уже существует',
          };
        }

        // Создаем новый параметр
        const { data, error } = await supabase
          .from('user_parameters')
          .insert({
            user_id: userId,
            parameter_name: parameterName.toLowerCase(),
            unit: unit,
            is_active: true,
            tracking_type: trackingType,
          })
          .select()
          .single();

        if (error) {
          // Обработка ошибки уникальности
          if (error.code === '23505') {
            return {
              success: false,
              error: 'Параметр с таким названием уже существует',
            };
          }
          throw error;
        }

        setParameters((prev) => [...prev, data]);
        return { success: true, data };
      } catch (err) {
        console.error('Ошибка добавления параметра:', err);
        setError(err.message);
        return { success: false, error: err.message };
      }
    },
    [userId],
  );

  // Обновление типа отслеживания
  const updateTrackingType = useCallback(
    async (parameterId, trackingType) => {
      try {
        setError(null);

        const { data, error } = await supabase
          .from('user_parameters')
          .update({ tracking_type: trackingType })
          .eq('id', parameterId)
          .eq('user_id', userId)
          .select()
          .single();

        if (error) throw error;

        setParameters((prev) =>
          prev.map((p) =>
            p.id === parameterId ? { ...p, tracking_type: trackingType } : p,
          ),
        );

        return { success: true, data };
      } catch (err) {
        console.error('Ошибка обновления типа отслеживания:', err);
        setError(err.message);
        return { success: false, error: err.message };
      }
    },
    [userId],
  );

  // Удаление параметра (полное физическое удаление)
  const deleteParameter = useCallback(
    async (parameterId) => {
      try {
        setError(null);

        // Получаем информацию о параметре
        const { data: parameter } = await supabase
          .from('user_parameters')
          .select('parameter_name')
          .eq('id', parameterId)
          .single();

        if (parameter) {
          // Удаляем все измерения для этого параметра
          const { error: measurementsError } = await supabase
            .from('measurements')
            .delete()
            .eq('user_id', userId)
            .eq('parameter', parameter.parameter_name);

          if (measurementsError) throw measurementsError;

          // Удаляем цель если есть
          const { error: goalsError } = await supabase
            .from('goals')
            .delete()
            .eq('user_id', userId)
            .eq('parameter', parameter.parameter_name);

          if (goalsError) throw goalsError;

          // Полностью удаляем параметр
          const { error: paramError } = await supabase
            .from('user_parameters')
            .delete()
            .eq('id', parameterId)
            .eq('user_id', userId);

          if (paramError) throw paramError;
        }

        setParameters((prev) => prev.filter((p) => p.id !== parameterId));
        return { success: true };
      } catch (err) {
        console.error('Ошибка удаления параметра:', err);
        setError(err.message);
        return { success: false, error: err.message };
      }
    },
    [userId],
  );

  useEffect(() => {
    fetchParameters();
  }, [fetchParameters]);

  return {
    parameters,
    loading,
    error,
    fetchParameters,
    addParameter,
    updateTrackingType,
    deleteParameter,
  };
};
