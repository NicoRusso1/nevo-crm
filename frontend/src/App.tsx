import { RouterProvider } from 'react-router-dom';
import { SalesProvider } from '@/components/sales/store';
import { router } from '@/routes';

export function App() {
  return (
    <SalesProvider>
      <RouterProvider router={router} />
    </SalesProvider>
  );
}
