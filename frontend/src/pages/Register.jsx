import React, { useContext, useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { SignInPage } from '../components/ui/sign-in-flow';
import { GoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';

const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { googleLogin, isAuthenticated } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || '/';

  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  const handleGoogleSuccess = async (credentialResponse) => {
    if (!credentialResponse?.credential) {
      toast.error("Google signup token missing");
      return;
    }
    setLoading(true);
    const result = await googleLogin(credentialResponse.credential);
    setLoading(false);
    if (result.success) {
      navigate(from, { replace: true });
    }
  };

  return (
    <SignInPage 
      title="Create Account" 
      subtitle="Sign up with your Google account" 
    >
      <div className="flex flex-col gap-6 mt-8 items-center w-full">
        {loading ? (
          <div className="text-white text-lg animate-pulse font-medium">Signing up with Google...</div>
        ) : (
          <div className="w-full flex justify-center scale-110">
            <GoogleLogin 
              onSuccess={handleGoogleSuccess}
              onError={() => toast.error("Google signup failed. Check VITE_GOOGLE_CLIENT_ID or Authorized Origins.")}
              theme="filled_black"
              shape="pill"
              size="large"
              text="signup_with_google"
              useOneTap={false}
            />
          </div>
        )}
      </div>
    </SignInPage>
  );
};

export default Register;
