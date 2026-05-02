// src/components/Login/Login.jsx
import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import styles from './Login.module.css';

function Login({ onSwitchToRegister }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h2 className={styles.title}>Вход</h2>

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

      <button type="submit" className={styles.button} disabled={loading}>
        {loading ? 'Вход...' : 'Войти'}
      </button>

      <p className={styles.switchText}>
        Нет аккаунта?{' '}
        <button
          type="button"
          onClick={onSwitchToRegister}
          className={styles.switchButton}
        >
          Зарегистрироваться
        </button>
      </p>
    </form>
  );
}

export default Login;
