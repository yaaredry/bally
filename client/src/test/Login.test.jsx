import { describe, test, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from './server';
import Login from '../pages/Login';
import { AuthProvider } from '../context/AuthContext';

function renderLogin() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <Login />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('Login page', () => {
  test('renders email and password fields and submit button', () => {
    renderLogin();
    expect(screen.getByPlaceholderText(/you@example\.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/••••••••/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
  });

  test('renders link to sign up page', () => {
    renderLogin();
    expect(screen.getByRole('link', { name: /create an account/i })).toBeInTheDocument();
  });

  test('shows loading state while submitting', async () => {
    renderLogin();
    fireEvent.change(screen.getByPlaceholderText(/you@example\.com/i), {
      target: { value: 'test@test.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/••••••••/i), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));
    expect(screen.getByText(/logging in/i)).toBeInTheDocument();
  });

  test('shows error message on login failure', async () => {
    server.use(
      http.post(/\/api\/auth\/login/, () =>
        HttpResponse.json({ error: 'Invalid email or password' }, { status: 401 })
      )
    );
    renderLogin();
    fireEvent.change(screen.getByPlaceholderText(/you@example\.com/i), {
      target: { value: 'wrong@test.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/••••••••/i), {
      target: { value: 'wrongpass' },
    });
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));
    await waitFor(() => {
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
    });
  });

  test('shows generic error when no server message', async () => {
    server.use(
      http.post(/\/api\/auth\/login/, () =>
        HttpResponse.json({}, { status: 500 })
      )
    );
    renderLogin();
    fireEvent.change(screen.getByPlaceholderText(/you@example\.com/i), {
      target: { value: 'x@test.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/••••••••/i), {
      target: { value: 'password' },
    });
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));
    await waitFor(() => {
      expect(screen.getByText(/login failed/i)).toBeInTheDocument();
    });
  });
});
