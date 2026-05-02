// src/components/Register/Register.jsx
import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import styles from './Register.module.css';

function Register({ onSwitchToLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Проверка совпадения паролей
    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    // Проверка длины пароля
    if (password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      // Показать сообщение об успешной регистрации
      alert('Регистрация успешна! Теперь вы можете войти.');
      onSwitchToLogin();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h2 className={styles.title}>Регистрация</h2>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.field}>
        <label className={styles.label}>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={styles.input}
          required
          placeholder="your@email.com"
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Пароль</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={styles.input}
          required
          placeholder="••••••••"
          minLength={6}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Подтвердите пароль</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className={styles.input}
          required
          placeholder="••••••••"
          minLength={6}
        />
      </div>

      <button type="submit" className={styles.button} disabled={loading}>
        {loading ? 'Регистрация...' : 'Зарегистрироваться'}
      </button>

      <p className={styles.switchText}>
        Уже есть аккаунт?{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className={styles.switchButton}
        >
          Войти
        </button>
      </p>
    </form>
  );
}

export default Register;
