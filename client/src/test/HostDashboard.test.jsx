import { describe, test, expect, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from './server';
import { AuthProvider } from '../context/AuthContext';
import HostDashboard from '../pages/HostDashboard';

const GAME_ID = 'game-123';
const USER_ID = 'user-1';

const mockGame = {
  id: GAME_ID,
  host_id: USER_ID,
  sport: 'Beach Volleyball',
  format: '2v2',
  skill_level: '3',
  game_date: new Date(Date.now() + 86400000).toISOString(),
  location_name: 'Gordon Beach',
  lat: 32.0861,
  lng: 34.7669,
  max_players: 4,
  approved_count: 1,
  status: 'open',
  notes: null,
  gear: [],
  can_chat: true,
  chat_messages: [],
  roster: [],
  my_request_id: null,
  my_request_status: null,
};

function renderDashboard() {
  return render(
    <MemoryRouter initialEntries={[`/host/${GAME_ID}`]}>
      <AuthProvider>
        <Routes>
          <Route path="/host/:gameId" element={<HostDashboard />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

function setupHandlers(gameOverrides = {}, requests = []) {
  server.use(
    http.get(new RegExp(`/api/games/${GAME_ID}/requests`), () =>
      HttpResponse.json({ requests })
    ),
    http.get(new RegExp(`/api/games/${GAME_ID}$`), () =>
      HttpResponse.json({ game: { ...mockGame, ...gameOverrides } })
    )
  );
}

describe('HostDashboard — Gear section', () => {
  test('renders the Gear section with all four items', async () => {
    setupHandlers();
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Gear')).toBeInTheDocument();
    });
    expect(screen.getByText('Ball')).toBeInTheDocument();
    expect(screen.getByText('Lines')).toBeInTheDocument();
    expect(screen.getByText('Speaker')).toBeInTheDocument();
    expect(screen.getByText('Hose')).toBeInTheDocument();
  });

  test('shows "Nobody yet" when no one has claimed a gear item', async () => {
    setupHandlers({ gear: [] });
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Gear')).toBeInTheDocument();
    });
    const nobodyLabels = screen.getAllByText('Nobody yet');
    expect(nobodyLabels.length).toBe(4);
  });

  test('shows "You" badge when host has already claimed an item', async () => {
    setupHandlers({
      gear: [{ item: 'ball', player_id: USER_ID, display_name: 'Test User', avatar_seed: 'beach-ace' }],
    });
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('You')).toBeInTheDocument();
    });
  });

  test('shows other player first-name when they claimed an item', async () => {
    setupHandlers({
      gear: [{ item: 'speaker', player_id: 'other-user', display_name: 'Maya Levi', avatar_seed: 'surfer-wave' }],
    });
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Maya')).toBeInTheDocument();
    });
  });

  test('adds gear when host clicks an unclaimed item', async () => {
    let addCalled = false;
    server.use(
      http.post(new RegExp(`/api/games/${GAME_ID}/gear`), () => {
        addCalled = true;
        return HttpResponse.json({ message: 'Gear added' }, { status: 201 });
      })
    );
    setupHandlers({ gear: [] });
    renderDashboard();
    await waitFor(() => expect(screen.getByText('Lines')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Lines').closest('button'));
    await waitFor(() => expect(addCalled).toBe(true));
    await waitFor(() => expect(screen.getByText('You')).toBeInTheDocument());
  });

  test('removes gear when host clicks their own claimed item', async () => {
    let deleteCalled = false;
    server.use(
      http.delete(new RegExp(`/api/games/${GAME_ID}/gear/hose`), () => {
        deleteCalled = true;
        return HttpResponse.json({ message: 'Gear removed' });
      })
    );
    setupHandlers({
      gear: [{ item: 'hose', player_id: USER_ID, display_name: 'Test User', avatar_seed: 'beach-ace' }],
    });
    renderDashboard();
    await waitFor(() => expect(screen.getByText('You')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Hose').closest('button'));
    await waitFor(() => expect(deleteCalled).toBe(true));
    await waitFor(() => expect(screen.queryByText('You')).not.toBeInTheDocument());
  });

  test('does not render Gear section for a cancelled game', async () => {
    setupHandlers({ status: 'cancelled' });
    renderDashboard();
    await waitFor(() => expect(screen.getByText('Game cancelled')).toBeInTheDocument());
    expect(screen.queryByText('Gear')).not.toBeInTheDocument();
  });
});

describe('HostDashboard — requests', () => {
  test('shows pending request count badge', async () => {
    setupHandlers({}, [
      { id: 'req-1', status: 'pending', display_name: 'Alex Chen', avatar_seed: 'beach-ace', skill_level: '5', player_id: 'p1' },
    ]);
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument();
    });
    expect(screen.getByText('Alex Chen')).toBeInTheDocument();
  });

  test('shows "No pending requests" when queue is empty', async () => {
    setupHandlers({}, []);
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText(/no pending requests/i)).toBeInTheDocument();
    });
  });
});

describe('HostDashboard — completed game', () => {
  test('shows completed status banner', async () => {
    setupHandlers({ status: 'completed' });
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText(/game completed/i)).toBeInTheDocument();
    });
  });

  test('still shows Gear section for a completed game', async () => {
    setupHandlers({ status: 'completed' });
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Gear')).toBeInTheDocument();
    });
  });
});
