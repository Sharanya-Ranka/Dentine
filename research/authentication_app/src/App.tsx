import { useEffect } from 'react';
import { useAuthStore } from './store/useAuthStore';
import { AuthView } from './components/Auth/AuthView';
import { DashboardView } from './components/Dashboard/DashboardView';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Keep data "fresh" for 1-2 minutes before triggering background refetches
      staleTime: 1000 * 60 * 5, // 2 minutes

      // Keep unused data in memory for 15 minutes
      gcTime: 1000 * 60 * 15,

      // Disable refetching on window focus (often annoying in desktop workflows)
      refetchOnWindowFocus: false,

      // Retry once instead of three times for faster UI error feedback
      retry: 1,
    },
  },
});


export default function App() {
  const initialize = useAuthStore((state) => state.initialize);
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);
  const verifyingToken = useAuthStore((state) => state.verifyingToken);

  useEffect(() => {
    const cleanup = initialize();
    return cleanup;
  }, [initialize]);

  if (isLoading || verifyingToken) {
    return (
      <QueryClientProvider client={queryClient}>
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
      </div>
      </QueryClientProvider>
    );
  }

  return <QueryClientProvider client={queryClient}>
    {!user ? <AuthView /> : <DashboardView />}
  </QueryClientProvider>
}