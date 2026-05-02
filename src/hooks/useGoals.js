// src/hooks/useGoals.js
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

/**
 * Хук для работы с целями
 * @param {string} userId - ID пользователя
 * @returns {Object} - данные и методы для работы с целями
 */
export const useGoals = (userId) => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Загрузка целей
  const fetchGoals = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      setGoals(data || []);
    } catch (err) {
      console.error('Ошибка загрузки целей:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Добавление цели
  const addGoal = useCallback(
    async (goal) => {
      try {
        setError(null);

        const { data, error } = await supabase
          .from('goals')
          .insert({
            user_id: userId,
            parameter: goal.parameter,
            target_value: goal.target_value,
            deadline: goal.deadline || null,
          })
          .select()
          .single();

        if (error) throw error;

        setGoals((prev) => [...prev, data]);
        return { success: true, data };
      } catch (err) {
        console.error('Ошибка добавления цели:', err);
        setError(err.message);
        return { success: false, error: err.message };
      }
    },
    [userId],
  );

  // Обновление цели
  const updateGoal = useCallback(async (goalId, updates) => {
    try {
      setError(null);

      const { data, error } = await supabase
        .from('goals')
        .update(updates)
        .eq('id', goalId)
        .select()
        .single();

      if (error) throw error;

      setGoals((prev) => prev.map((g) => (g.id === goalId ? data : g)));
      return { success: true, data };
    } catch (err) {
      console.error('Ошибка обновления цели:', err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, []);

  // Удаление цели
  const deleteGoal = useCallback(async (goalId) => {
    try {
      setError(null);

      const { error } = await supabase.from('goals').delete().eq('id', goalId);

      if (error) throw error;

      setGoals((prev) => prev.filter((g) => g.id !== goalId));
      return { success: true };
    } catch (err) {
      console.error('Ошибка удаления цели:', err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  return {
    goals,
    loading,
    error,
    fetchGoals,
    addGoal,
    updateGoal,
    deleteGoal,
  };
};
