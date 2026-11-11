import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './App.css'
import { PrescriptionsPage } from './pages/PrescriptionsPage'


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 15,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});


function App() {

  return (
    <QueryClientProvider client={queryClient}>
      <PrescriptionsPage />
    </QueryClientProvider>
  )
}

export default App
