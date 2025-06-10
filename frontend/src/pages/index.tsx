import { useEffect } from 'react';
import { useRouter } from 'next/router';

/**
 * Home page - redirects to prompt submission
 */
function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to prompt submission page
    router.push('/prompts/submit');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-3xl font-bold">PromptWeaver</h1>
        <p className="mt-2">Redirecting to prompt submission...</p>
      </div>
    </div>
  );
}

export default Home;
