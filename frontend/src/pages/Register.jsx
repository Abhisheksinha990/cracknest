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
      subtitle="Join CrackNest today" 
    >
      <div className="flex flex-col gap-4 mt-8 items-center w-full">
        {loading ? (
          <div className="text-white text-lg">Signing up...</div>
        ) : (
          <div className="w-full flex justify-center">
            <GoogleLogin 
              onSuccess={handleGoogleSuccess}
              onError={() => toast.error("Google signup failed")}
              theme="filled_black"
              shape="pill"
              size="large"
              text="signup_with_google"
            />
          </div>
        )}
      </div>
    </SignInPage>
  );
};

export default Register;
