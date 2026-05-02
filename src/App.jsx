// src/App.jsx
import { useState, useEffect, useCallback } from 'react';
import Login from './components/Login/Login';
import Register from './components/Register/Register';
import Dashboard from './components/Dashboard/Dashboard';
import { supabase } from './lib/supabaseClient';
import styles from './App.module.css';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRegister, setShowRegister] = useState(false);

  // Проверка текущей сессии
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Подписка на изменения авторизации
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Загрузка...</p>
      </div>
    );
  }

  // Если нет сессии - показываем форму входа/регистрации
  if (!session) {
    return (
      <div className={styles.authContainer}>
        <h1 className={styles.appTitle}>Weight Tracker</h1>
        <p className={styles.appSubtitle}>
          Отслеживание веса и параметров тела
        </p>
        {showRegister ? (
          <Register onSwitchToLogin={() => setShowRegister(false)} />
        ) : (
          <Login onSwitchToRegister={() => setShowRegister(true)} />
        )}
      </div>
    );
  }

  // Основное приложение
  return <Dashboard session={session} onLogout={handleLogout} />;
}

export default App;
