import { describe, test, expect } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from './server';
import { AuthProvider, useAuth } from '../context/AuthContext';

function AuthDisplay() {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading…</div>;
  if (!user) return <div>Not logged in</div>;
  return <div>Hello {user.display_name}</div>;
}

function renderWithAuth(ui) {
  return render(
    <MemoryRouter>
      <AuthProvider>{ui}</AuthProvider>
    </MemoryRouter>
  );
}

describe('AuthContext', () => {
  test('shows loading then user from /auth/me', async () => {
    renderWithAuth(<AuthDisplay />);
    expect(screen.getByText('Loading…')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('Hello Test User')).toBeInTheDocument();
    });
  });

  test('shows not logged in when /auth/me fails', async () => {
    server.use(
      http.get(/\/api\/auth\/me/, () =>
        HttpResponse.json({ error: 'Not authenticated' }, { status: 401 })
      )
    );
    renderWithAuth(<AuthDisplay />);
    await waitFor(() => {
      expect(screen.getByText('Not logged in')).toBeInTheDocument();
    });
  });

  test('login sets user state', async () => {
    function LoginButton() {
      const { user, login } = useAuth();
      return (
        <>
          <div data-testid="user">{user?.display_name || 'none'}</div>
          <button onClick={() => login('test@test.com', 'password123')}>Login</button>
        </>
      );
    }

    // Start unauthenticated
    server.use(
      http.get(/\/api\/auth\/me/, () =>
        HttpResponse.json({ error: 'Not authenticated' }, { status: 401 })
      )
    );

    renderWithAuth(<LoginButton />);
    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('none');
    });

    await act(async () => {
      screen.getByRole('button').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('Test User');
    });
  });

  test('logout clears user state', async () => {
    function LogoutButton() {
      const { user, logout } = useAuth();
      return (
        <>
          <div data-testid="user">{user?.display_name || 'none'}</div>
          <button onClick={logout}>Logout</button>
        </>
      );
    }

    renderWithAuth(<LogoutButton />);
    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('Test User');
    });

    await act(async () => {
      screen.getByRole('button').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('none');
    });
  });

  test('signup sets user state', async () => {
    server.use(
      http.get(/\/api\/auth\/me/, () =>
        HttpResponse.json({ error: 'Not authenticated' }, { status: 401 })
      )
    );

    function SignupButton() {
      const { user, signup } = useAuth();
      return (
        <>
          <div data-testid="user">{user?.display_name || 'none'}</div>
          <button onClick={() => signup({ email: 'new@test.com', password: 'pw', display_name: 'New User' })}>
            Signup
          </button>
        </>
      );
    }

    renderWithAuth(<SignupButton />);
    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('none');
    });

    await act(async () => {
      screen.getByRole('button').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('New User');
    });
  });

  test('updateUser merges partial updates', async () => {
    function UpdateButton() {
      const { user, updateUser } = useAuth();
      return (
        <>
          <div data-testid="name">{user?.display_name}</div>
          <div data-testid="beach">{user?.home_beach || 'none'}</div>
          <button onClick={() => updateUser({ home_beach: 'Hilton Beach' })}>Update</button>
        </>
      );
    }

    renderWithAuth(<UpdateButton />);
    await waitFor(() => {
      expect(screen.getByTestId('name').textContent).toBe('Test User');
    });

    await act(async () => {
      screen.getByRole('button').click();
    });

    expect(screen.getByTestId('name').textContent).toBe('Test User');
    expect(screen.getByTestId('beach').textContent).toBe('Hilton Beach');
  });
});
