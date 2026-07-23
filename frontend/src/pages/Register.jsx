import React, { useContext, useState } from 'react';
import { useNavigate, useLocation, Navigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { SignInPage } from '../components/ui/sign-in-flow';
import { useGoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';
import { User, Mail, Lock, Zap, ArrowRight } from 'lucide-react';

const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { register, googleLogin, guestLogin, isAuthenticated } = useContext(AuthContext);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || '/';

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    setLoading(true);
    const result = await register(name, email, password);
    setLoading(false);
    if (result.success) {
      navigate(from, { replace: true });
    }
  };

  const handleGuestAccess = async () => {
    setLoading(true);
    const result = await guestLogin();
    setLoading(false);
    if (result.success) {
      navigate(from, { replace: true });
    }
  };

  const processGoogleToken = async (tokenStr) => {
    setLoading(true);
    const result = await googleLogin(tokenStr);
    setLoading(false);
    if (result.success) {
      navigate(from, { replace: true });
    }
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      if (tokenResponse?.access_token) {
        processGoogleToken(tokenResponse.access_token);
      }
    },
    onError: () => toast.error("Google OAuth requested access error. Try Instant Public Login or Email!"),
  });

  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  return (
    <SignInPage 
      title="Create Account" 
      subtitle="Join CrackNest easily or sign in instantly" 
    >
      <div className="flex flex-col gap-4 mt-4 w-full max-w-sm mx-auto">
        
        {/* Instant Guest Access Button */}
        <button
          type="button"
          onClick={handleGuestAccess}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-full shadow-lg shadow-emerald-900/30 transition-all transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          <Zap className="w-5 h-5 text-yellow-300 fill-yellow-300" />
          <span>Instant Public Login (1-Click)</span>
        </button>

        <div className="relative flex items-center justify-center my-1">
          <div className="border-t border-white/10 w-full"></div>
          <span className="bg-black px-3 text-xs text-zinc-400 font-medium uppercase tracking-wider">or sign up with email</span>
          <div className="border-t border-white/10 w-full"></div>
        </div>

        {/* Email & Password Registration Form */}
        <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-3">
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-zinc-900/80 border border-zinc-800 focus:border-emerald-500 rounded-full text-white placeholder-zinc-500 text-sm focus:outline-none transition-colors"
              required
            />
          </div>

          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-zinc-900/80 border border-zinc-800 focus:border-emerald-500 rounded-full text-white placeholder-zinc-500 text-sm focus:outline-none transition-colors"
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="password"
              placeholder="Create Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-zinc-900/80 border border-zinc-800 focus:border-emerald-500 rounded-full text-white placeholder-zinc-500 text-sm focus:outline-none transition-colors"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-full border border-zinc-700 transition-all cursor-pointer mt-1"
          >
            {loading ? "Creating Account..." : "Sign Up with Email"}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="relative flex items-center justify-center my-1">
          <div className="border-t border-white/10 w-full"></div>
          <span className="bg-black px-3 text-xs text-zinc-400 font-medium uppercase tracking-wider">or</span>
          <div className="border-t border-white/10 w-full"></div>
        </div>

        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={() => handleGoogleLogin()}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 px-5 py-3 bg-white/10 hover:bg-white/15 text-white font-medium rounded-full border border-white/10 transition-all cursor-pointer"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          Sign up with Google
        </button>

        <p className="text-center text-xs text-zinc-400 mt-2">
          Already have an account?{' '}
          <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-medium underline">
            Sign In
          </Link>
        </p>

      </div>
    </SignInPage>
  );
};

export default Register;

