import React, { useContext, useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { SignInPage } from '../components/ui/sign-in-flow';
import { GoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { googleLogin, isAuthenticated } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);

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

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    const result = await googleLogin(credentialResponse.credential);
    setLoading(false);
    if (result.success) {
      const target = location.state?.from?.pathname || '/resume';
      navigate(target, { replace: true });
    }
  };

  return (
    <SignInPage 
      title="Welcome Back"
      subtitle="Sign in to your account"
    >
      <div className="flex flex-col gap-4 mt-8 items-center w-full">
        {loading ? (
          <div className="text-white text-lg">Signing in...</div>
        ) : (
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
        )}
      </div>
    </SignInPage>
  );
};

export default Login;
