import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { CustomAuthComponents } from '../components/CustomAuthComponents';

/**
 * Home page - redirects to prompt submission
 */
function Home() {
  const router = useRouter();
  const components = CustomAuthComponents();

  useEffect(() => {
    // Redirect to prompt submission page after authentication
    router.push('/prompts/submit');
  }, [router]);

  return (
    <Authenticator components={components}>
      {({ signOut, user }) => (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-3xl font-bold">PromptWeaver</h1>
            <p className="mt-2">Redirecting to prompt submission...</p>
          </div>
        </div>
      )}
    </Authenticator>
  );
}

export default Home;
