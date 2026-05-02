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

      setParameters(data || []);
    } catch (err) {
      console.error('Ошибка загрузки параметров:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Добавление параметра
  const addParameter = useCallback(
    async (parameterName, unit) => {
      try {
        setError(null);

        const { data, error } = await supabase
          .from('user_parameters')
          .insert({
            user_id: userId,
            parameter_name: parameterName,
            unit: unit,
            is_active: true,
          })
          .select()
          .single();

        if (error) throw error;

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

  // Удаление параметра (деактивация)
  const deleteParameter = useCallback(async (parameterId) => {
    try {
      setError(null);

      const { error } = await supabase
        .from('user_parameters')
        .update({ is_active: false })
        .eq('id', parameterId);

      if (error) throw error;

      setParameters((prev) => prev.filter((p) => p.id !== parameterId));
      return { success: true };
    } catch (err) {
      console.error('Ошибка удаления параметра:', err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, []);

  useEffect(() => {
    fetchParameters();
  }, [fetchParameters]);

  return {
    parameters,
    loading,
    error,
    fetchParameters,
    addParameter,
    deleteParameter,
  };
};
