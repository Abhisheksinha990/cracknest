import React, { useContext, useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation, Navigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { SignInPage } from '../components/ui/sign-in-flow';
import { GoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, googleLogin, isAuthenticated } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const from = location.state?.from?.pathname || '/';
  const hasShownToast = useRef(false);

  useEffect(() => {
    if (location.state?.from && !hasShownToast.current) {
      toast('Please log in to access this feature', {
        icon: '🔒',
        duration: 4000,
      });
      hasShownToast.current = true;
    }
  }, [location.state]);

  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.success) {
      navigate(from, { replace: true });
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    const result = await googleLogin(credentialResponse.credential);
    setLoading(false);
    if (result.success) {
      navigate(from, { replace: true });
    }
  };

  return (
    <SignInPage 
      title="Welcome Back"
      subtitle="Sign in to your CrackNest account"
      bottomText="Don't have an account?"
      bottomLinkText="Sign up"
      bottomLinkHref="/register"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2 w-full">
        <div className="flex flex-col gap-1 text-left">
          <label className="text-sm font-medium text-gray-300">Email Address</label>
          <input 
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2.5 bg-zinc-900/80 border border-zinc-700/60 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition-colors"
            required
          />
        </div>
        <div className="flex flex-col gap-1 text-left">
          <label className="text-sm font-medium text-gray-300">Password</label>
          <input 
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2.5 bg-zinc-900/80 border border-zinc-700/60 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition-colors"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 mt-2 bg-gradient-to-r from-cyan-500 to-teal-500 text-black font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg shadow-cyan-500/20"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <div className="relative flex items-center justify-center my-4 w-full">
        <div className="border-t border-zinc-800 w-full"></div>
        <span className="bg-black px-3 text-xs text-zinc-500 absolute uppercase tracking-wider">or</span>
      </div>

      <div className="w-full flex justify-center">
        <GoogleLogin 
          onSuccess={handleGoogleSuccess}
          onError={() => toast.error("Google login failed")}
          theme="filled_black"
          shape="pill"
          size="large"
          text="continue_with_google"
        />
      </div>
    </SignInPage>
  );
};

export default Login;
