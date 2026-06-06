import { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../sections/Navbar';
import Footer from '../../sections/Footer';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!supabase) {
      setError("Supabase is not configured. Please add your keys to .env.local");
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);

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

  return (
    <div className="login-page">
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
                  onClick={() => { setIsLogin(true); setError(null); setSuccess(null); }}
                >
                  Login
                </button>
                <button 
                  className={`auth-tab ${!isLogin ? 'active' : ''}`}
                  onClick={() => { setIsLogin(false); setError(null); setSuccess(null); }}
                >
                  Sign Up
                </button>
              </div>

              <h1 className="login-title">
                {isLogin ? 'Welcome Back' : 'Create Account'}
              </h1>
              <p className="login-subtitle">
                {isLogin 
                  ? 'Sign in to access your BludWear account.'
                  : 'Join the bloodline. Create your account below.'}
              </p>

              <form className="auth-form" onSubmit={handleSubmit}>
                {error && <div className="login-error-msg">{error}</div>}
                {success && <div className="login-success-msg">{success}</div>}
                
                {!isLogin && (
                  <div className="input-group">
                    <label>Full Name</label>
                    <input 
                      type="text" 
                      placeholder="John Doe" 
                      required 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                )}
                <div className="input-group">
                  <label>Email Address</label>
                  <input 
                    type="email" 
                    placeholder="email@example.com" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                  />
                </div>
                
                {isLogin && (
                  <div className="forgot-password">
                    <a href="#">Forgot your password?</a>
                  </div>
                )}

                <button type="submit" className="login-submit-btn" disabled={loading}>
                  {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
                </button>
              </form>

              <div className="login-footer">
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
