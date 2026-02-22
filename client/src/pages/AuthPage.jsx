import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { authApi } from '../api/client';
import { useAuth } from '../context/AuthContext';

const AuthPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, login, register } = useAuth();

  const [mode, setMode] = useState('login');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [apiStatus, setApiStatus] = useState({ loading: true, ok: false, message: '' });
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'buyer',
    groupCode: ''
  });

  useEffect(() => {
    const checkApi = async () => {
      try {
        const response = await authApi.health();
        setApiStatus({ loading: false, ok: true, message: response.message || 'API is healthy' });
      } catch (err) {
        setApiStatus({ loading: false, ok: false, message: err.message });
      }
    };

    checkApi();
  }, []);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        await login({ email: form.email, password: form.password });
      } else {
        await register({
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
          groupCode: form.groupCode
        });
      }

      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-shell">
      <section className="auth-copy">
        <h1 className="brand-title">
          <span className="brand-logo">LedgerBook</span>
        </h1>
        <p>
          Shared monthly credit ledger for buyer and seller with dual approval, shortcuts, automation, and smart
          recommendations.
        </p>
      </section>

      <section className="panel auth-panel">
        <div className="mode-toggle">
          <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>
            Login
          </button>
          <button className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>
            Sign Up
          </button>
        </div>

        <p className={apiStatus.ok ? 'ok-text' : 'error-text'}>
          {apiStatus.loading
            ? 'Checking backend...'
            : apiStatus.ok
              ? 'Backend connected'
              : `Backend issue: ${apiStatus.message}`}
        </p>

        <form onSubmit={onSubmit} className="auth-form">
          {mode === 'register' ? (
            <label>
              Full Name
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
              />
            </label>
          ) : null}

          <label>
            Email
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
            />
          </label>

          <label>
            Password
            <input
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={(e) => updateField('password', e.target.value)}
            />
          </label>

          {mode === 'register' ? (
            <>
              <label>
                Role
                <select value={form.role} onChange={(e) => updateField('role', e.target.value)}>
                  <option value="buyer">Buyer</option>
                  <option value="seller">Seller</option>
                </select>
              </label>

              <label>
                Shared Group Code
                <input
                  type="text"
                  required
                  value={form.groupCode}
                  onChange={(e) => updateField('groupCode', e.target.value.toUpperCase())}
                  placeholder="Example: HOME123"
                />
              </label>
            </>
          ) : null}

          {error ? <p className="error-text">{error}</p> : null}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Please wait...' : mode === 'login' ? 'Login' : 'Create Account'}
          </button>
        </form>
      </section>
    </main>
  );
};

export default AuthPage;
