import React from 'react'
import ReactDOM from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import App from './App.jsx'
import './index.css'

import { AuthProvider } from './context/AuthContext'

// Using a placeholder client ID for now, or reading from environment variable.
const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '1234567890-mockclientid.apps.googleusercontent.com';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={clientId}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>,
)
