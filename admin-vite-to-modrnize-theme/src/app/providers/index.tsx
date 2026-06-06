import { RouterProvider } from 'react-router-dom';
import { Provider } from 'react-redux';
import { router } from '../router';
import { store } from '../store';
import { SessionManager } from './SessionManager';
import { SignalRProvider } from './SignalRProvider';

export function AppProviders() {
  return (
    <Provider store={store}>
      <SessionManager>
        <SignalRProvider>
          <RouterProvider router={router} />
        </SignalRProvider>
      </SessionManager>
    </Provider>
  );
}
