import React, { useEffect } from 'react';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';

const HomePage: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // If session is loading, do nothing yet
    if (status === 'loading') return;

    // If user is authenticated, redirect to dashboard
    if (session) {
      router.push('/dashboard');
    } else {
      // If user is not authenticated, redirect to login
      router.push('/login');
    }
  }, [session, status, router]);

  // Show a loading indicator while checking session status
  return (
    <div className="flex justify-center items-center h-screen">
      <p>Loading...</p>
    </div>
  );
};

export default HomePage;
