// src/hooks/useMeasurements.js
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

/**
 * Хук для работы с измерениями
 * @param {string} userId - ID пользователя
 * @returns {Object} - данные и методы для работы с измерениями
 */
export const useMeasurements = (userId) => {
  const [measurements, setMeasurements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Загрузка измерений
  const fetchMeasurements = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('measurements')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (error) throw error;

      setMeasurements(data || []);
    } catch (err) {
      console.error('Ошибка загрузки измерений:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Добавление измерения
  const addMeasurement = useCallback(
    async (measurement) => {
      try {
        setError(null);

        const { data, error } = await supabase
          .from('measurements')
          .insert({
            user_id: userId,
            date: measurement.date,
            parameter: measurement.parameter,
            value: measurement.value,
          })
          .select()
          .single();

        if (error) throw error;

        setMeasurements((prev) => [...prev, data]);
        return { success: true, data };
      } catch (err) {
        console.error('Ошибка добавления измерения:', err);
        setError(err.message);
        return { success: false, error: err.message };
      }
    },
    [userId],
  );

  // Обновление измерения
  const updateMeasurement = useCallback(async (id, updates) => {
    try {
      setError(null);

      const { data, error } = await supabase
        .from('measurements')
        .update({
          date: updates.date,
          value: updates.value,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setMeasurements((prev) => prev.map((m) => (m.id === id ? data : m)));
      return { success: true, data };
    } catch (err) {
      console.error('Ошибка обновления измерения:', err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, []);

  // Удаление измерения
  const deleteMeasurement = useCallback(async (id) => {
    try {
      setError(null);

      const { error } = await supabase
        .from('measurements')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setMeasurements((prev) => prev.filter((m) => m.id !== id));
      return { success: true };
    } catch (err) {
      console.error('Ошибка удаления измерения:', err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, []);

  useEffect(() => {
    fetchMeasurements();
  }, [fetchMeasurements]);

  return {
    measurements,
    loading,
    error,
    fetchMeasurements,
    addMeasurement,
    updateMeasurement,
    deleteMeasurement,
  };
};
