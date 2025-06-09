import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { Auth, Hub } from 'aws-amplify';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    // Set up a listener for auth events
    const listener = (data: any) => {
      switch (data.payload.event) {
        case 'signIn':
          console.log('User signed in');
          router.push('/prompts/submit');
          break;
        case 'signOut':
          console.log('User signed out');
          router.push('/');
          break;
        case 'signIn_failure':
          console.error('Sign in failure', data.payload.data);
          router.push('/');
          break;
      }
    };

    Hub.listen('auth', listener);

    // Handle the OAuth callback
    const handleOAuthCallback = async () => {
      try {
        await Auth.currentAuthenticatedUser();
        router.push('/prompts/submit');
      } catch (error) {
        console.error('Error handling OAuth callback:', error);
      }
    };

    handleOAuthCallback();

    return () => Hub.remove('auth', listener);
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">Completing sign in...</h1>
        <p className="mt-2">Please wait while we complete the authentication process.</p>
      </div>
    </div>
  );
}
