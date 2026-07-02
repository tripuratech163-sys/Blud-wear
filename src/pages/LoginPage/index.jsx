import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Navbar from '../../sections/Navbar';
import Footer from '../../sections/Footer';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [authMethod, setAuthMethod] = useState('email'); // Default to email for now

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  if (user) {
    navigate('/');
    return null;
  }

  // Removed recaptcha setup

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!supabase) {
      setError("Supabase is not configured. Please add your keys to .env.local");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    // Mobile Auth Flow removed (Firebase deprecated)

    // Form Validations
    if (!isLogin && name.trim().length < 2) {
      setError("Please enter a valid name (at least 2 characters).");
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        // Sign In
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        // Navigation is handled automatically via AuthContext pushing user state
        navigate('/');
      } else {
        // Sign Up
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name }
          }
        });
        if (error) throw error;
        // Supabase sends a confirmation email
        setSuccess("We have sent a confirmation email! Please check your inbox and verify your account to continue.");
        // Clear form
        setEmail('');
        setPassword('');
        setName('');
      }
    } catch (err) {
      setError(err.message || "An error occurred during authentication.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        }
      });
      if (error) throw error;
      // Note: Navigation will happen automatically after OAuth redirect
    } catch (err) {
      setError(err.message || "An error occurred during Google authentication.");
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <Helmet>
        <title>Login / Sign Up | BludWear</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <Navbar />

      <main className="login-main">
        <div className="login-split">
          {/* Left Side: Image */}
          <div className="login-visual">
            <img src="/hero.png" alt="BludWear Lifestyle" className="login-img" />
            <div className="login-visual-overlay"></div>
            <div className="login-visual-text">
              <h2>FORGED IN BLOOD & SWEAT</h2>
              <p>Join the elite. Unlock exclusive drops, members-only rewards, and early access to all our collections.</p>
            </div>
          </div>

          {/* Right Side: Form */}
          <div className="login-form-container">
            <div className="login-form-wrapper">
              <div className="auth-tabs">
                <button
                  className={`auth-tab ${isLogin ? 'active' : ''}`}
                  onClick={() => { setIsLogin(true); setError(null); setSuccess(null); setOtpSent(false); }}
                >
                  Login
                </button>
                <button
                  className={`auth-tab ${!isLogin ? 'active' : ''}`}
                  onClick={() => { setIsLogin(false); setError(null); setSuccess(null); setOtpSent(false); }}
                >
                  Sign Up
                </button>
              </div>

              {/* Auth Method Toggle Removed */}

              <h1 className="login-title">
                {isLogin ? 'ENTER THE BLOODLINE' : 'Create Account'}
              </h1>
              <p className="login-subtitle">
                {isLogin
                  ? 'ACCESS SECURED. VERIFY IDENTITY.'
                  : 'NO COMPROMISES. ENLIST BELOW.'}
              </p>

              <form className="auth-form" onSubmit={handleSubmit}>
                <div id="recaptcha-container"></div>
                {error && <div className="login-error-msg">{error}</div>}
                {success && <div className="login-success-msg">{success}</div>}

                {!isLogin && (
                  <div className="input-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      placeholder="John Doe"
                      required={authMethod === 'email'}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      maxLength="100"
                    />
                  </div>
                )}

                  <>
                    <div className="input-group">
                      <label>Email Address</label>
                      <input
                        type="email"
                        placeholder="email@example.com"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        maxLength="150"
                      />
                    </div>
                    <div className="input-group">
                      <label>Password</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        maxLength="100"
                      />
                    </div>
                    {isLogin && (
                      <div className="forgot-password">
                        <a href="#">Forgot your password?</a>
                      </div>
                    )}
                  </>

                <button type="submit" className="login-submit-btn" disabled={loading}>
                  {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
                </button>
              </form>

              <div className="auth-divider" style={{ display: 'flex', alignItems: 'center', margin: '2rem 0', color: '#666', fontSize: '0.85rem' }}>
                <span style={{ flex: 1, height: '1px', background: '#333' }}></span>
                <span style={{ padding: '0 1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Or</span>
                <span style={{ flex: 1, height: '1px', background: '#333' }}></span>
              </div>

              <button
                type="button"
                className="google-auth-btn"
                onClick={handleGoogleLogin}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.75rem',
                  backgroundColor: '#fff',
                  color: '#000',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  fontFamily: 'inherit'
                }}
              >
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" style={{ width: '20px', height: '20px' }} />
                Continue with Google
              </button>

              <div className="login-footer" style={{ marginTop: '2rem' }}>
                <p>
                  {isLogin ? "Don't have an account?" : "Already have an account?"}
                  <button
                    type="button"
                    className="toggle-auth-btn"
                    onClick={() => { setIsLogin(!isLogin); setError(null); setSuccess(null); }}
                  >
                    {isLogin ? 'Sign Up' : 'Log In'}
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default LoginPage;
