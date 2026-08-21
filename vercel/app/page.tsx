'use client';

/**
 * Root Landing Page
 * 
 * This page serves as the root path (/) and redirects to /demo by default.
 * 
 * CUSTOMIZATION OPTIONS:
 * 
 * 1. Change redirect destination:
 *    Change 'router.push('/demo')' to any path you want:
 *    - router.push('/') - redirect to self (creates loop - DON'T DO THIS)
 *    - router.push('/api/search-jobs') - redirect to API docs
 *    - router.push('https://example.com') - external redirect
 * 
 * 2. Show a custom landing page instead:
 *    Replace the return statement with your own UI:
 *    ```
 *    return (
 *      <div>
 *        <h1>Welcome to Job Search</h1>
 *        <a href="/demo">Start Searching</a>
 *      </div>
 *    );
 *    ```
 * 
 * 3. Show a loading spinner:
 *    Keep this implementation, it will show nothing during redirect
 * 
 * DEPLOYMENT:
 * - This file automatically serves at: https://your-app.vercel.app/
 * - No /demo suffix needed
 * - Users are transparently redirected to the demo page
 */

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to /demo on page load
    router.push('/demo');
  }, [router]);

  // Return nothing while redirecting (blank page for ~500ms)
  // If you want to show a loading message, replace with:
  // return <div className="flex items-center justify-center h-screen">Loading...</div>;
  return null;
}
