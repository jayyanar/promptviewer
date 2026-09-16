import { useEffect } from 'react';
import { AppProps } from 'next/app';
import { Amplify } from 'aws-amplify';
import '../styles/globals.css';
import Layout from '../components/Layout';
import { AuthProvider } from '../contexts/AuthContext';

// Configure Amplify
// Note: In production, these values should come from environment variables
Amplify.configure({
  Auth: {
    region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
    userPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID,
    userPoolWebClientId: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID,
    mandatorySignIn: false,
    oauth: {
      domain: process.env.NEXT_PUBLIC_AUTH_DOMAIN || `${process.env.NEXT_PUBLIC_USER_POOL_ID?.split('_')[0]}.auth.${process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1'}.amazoncognito.com`,
      scope: ['email', 'profile', 'openid'],
      redirectSignIn: typeof window !== 'undefined' ? window.location.origin + '/auth/callback' : 'http://localhost:3000/auth/callback',
      redirectSignOut: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
      responseType: 'code',
    },
  ssr: false,
  },
  API: {
    endpoints: [
      {
        name: 'promptweaver',
        endpoint: process.env.NEXT_PUBLIC_API_URL,
        region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
      },
    ],
  },
});

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </AuthProvider>
  );
}

export default MyApp;
