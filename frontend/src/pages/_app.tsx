import { AppProps } from 'next/app';
import '../styles/globals.css';
import Layout from '../components/Layout';
import { AuthProvider } from '../contexts/AuthContext';

// Removed Amplify configuration - authentication disabled for demo purposes

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
