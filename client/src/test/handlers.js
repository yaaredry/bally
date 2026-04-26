import { http, HttpResponse } from 'msw';

// Use regex patterns to match any origin (works across jsdom/happy-dom)
const mockUser = {
  id: 'user-1',
  email: 'test@test.com',
  display_name: 'Test User',
  sports: ['Beach Volleyball'],
  skill_level: '3',
  avatar_seed: 'beach-ace',
  games_hosted: 0,
  games_played: 0,
};

export const handlers = [
  http.get(/\/api\/auth\/me/, () =>
    HttpResponse.json({ user: mockUser })
  ),

  http.post(/\/api\/auth\/login/, () =>
    HttpResponse.json({ user: mockUser })
  ),

  http.post(/\/api\/auth\/logout/, () =>
    HttpResponse.json({ message: 'Logged out' })
  ),

  http.post(/\/api\/auth\/signup/, () =>
    HttpResponse.json(
      {
        user: {
          id: 'user-new',
          email: 'new@test.com',
          display_name: 'New User',
          sports: [],
          skill_level: null,
          avatar_seed: 'beach-ace',
          games_hosted: 0,
          games_played: 0,
        },
      },
      { status: 201 }
    )
  ),

  http.get(/\/api\/games\/my\/games/, () =>
    HttpResponse.json({ hosting: [], joined: [] })
  ),

  http.get(/\/api\/games/, () =>
    HttpResponse.json({
      games: [
        {
          id: 'game-1',
          sport: 'Beach Volleyball',
          format: '2v2',
          skill_level: '3',
          game_date: new Date(Date.now() + 86400000).toISOString(),
          location_name: 'Gordon Beach',
          lat: 32.0861,
          lng: 34.7669,
          max_players: 4,
          approved_count: 2,
          slots_remaining: 2,
          host_name: 'Test Host',
          host_avatar: 'beach-ace',
          status: 'open',
        },
      ],
    })
  ),

  http.get(/\/api\/locations/, () =>
    HttpResponse.json({
      locations: [
        { id: 'loc-1', name: 'Gordon Beach', city: 'Tel Aviv', lat: 32.0861, lng: 34.7669 },
      ],
    })
  ),

  http.get(/\/api\/players\/me/, () =>
    HttpResponse.json({
      player: {
        id: 'user-1',
        display_name: 'Test User',
        sports: ['Beach Volleyball'],
        skill_level: '3',
        home_beach: 'Gordon Beach',
        avatar_seed: 'beach-ace',
        games_hosted: 2,
        games_played: 5,
      },
    })
  ),

  http.put(/\/api\/players\/me/, () =>
    HttpResponse.json({
      player: {
        id: 'user-1',
        display_name: 'Updated User',
        sports: ['Beach Volleyball'],
        skill_level: '3',
        home_beach: 'Gordon Beach',
        avatar_seed: 'beach-ace',
        games_hosted: 2,
        games_played: 5,
      },
    })
  ),
];
