import { fireEvent, render, screen } from '@testing-library/react';
import App from './App';
import { getMovieDetails, getMovieList, getTopRatedMovies } from './api';

jest.mock('./api', () => ({
  getMovieList: jest.fn(),
  getTopRatedMovies: jest.fn(),
  getMovieDetails: jest.fn(),
  searchMovie: jest.fn(),
}));

test('shows a notification when a movie is added to and removed from favorites', async () => {
  const movie = {
    id: 1,
    title: 'Test Movie',
    poster_path: '/test.jpg',
    release_date: '2025-01-01',
    vote_average: 8,
  };
  getMovieList.mockResolvedValue([movie]);
  getTopRatedMovies.mockResolvedValue([]);

  render(<App />);

  const addFavoriteButton = await screen.findByTitle('Tambahkan Favorit');
  const movieCard = addFavoriteButton.closest('.Movie-wrapper');
  fireEvent.click(addFavoriteButton);
  expect(screen.getByTitle('Hapus Favorit').closest('.Movie-wrapper')).toBe(
    movieCard
  );
  expect(screen.getByRole('status')).toHaveTextContent(
    'Test Movie ditambahkan ke favorit'
  );

  fireEvent.click(screen.getByTitle('Hapus Favorit'));
  expect(screen.getByRole('status')).toHaveTextContent(
    'Test Movie dihapus dari favorit'
  );
});

test('loads and displays the top-rated movie list', async () => {
  const topRatedMovie = {
    id: 2,
    title: 'Top Rated Movie',
    poster_path: '/top-rated.jpg',
    release_date: '2024-01-01',
    vote_average: 9.2,
  };
  getMovieList.mockResolvedValue([]);
  getTopRatedMovies.mockResolvedValue([topRatedMovie]);

  render(<App />);

  fireEvent.click(screen.getByRole('button', { name: /top rated/i }));

  expect(await screen.findByText('Top Rated Movie')).toBeInTheDocument();
  expect(getTopRatedMovies).toHaveBeenCalledTimes(1);
});

test('returns to the popular movie list with the back button', async () => {
  const popularMovie = {
    id: 3,
    title: 'Popular Movie',
    poster_path: '/popular.jpg',
    release_date: '2023-01-01',
    vote_average: 7.5,
  };
  const topRatedMovie = {
    id: 4,
    title: 'Top Rated Movie',
    poster_path: '/top-rated.jpg',
    release_date: '2024-01-01',
    vote_average: 9.2,
  };
  getMovieList.mockResolvedValue([popularMovie]);
  getTopRatedMovies.mockResolvedValue([topRatedMovie]);

  render(<App />);

  fireEvent.click(screen.getByRole('button', { name: /top rated/i }));
  expect(await screen.findByText('Top Rated Movie')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /kembali ke daftar film/i }));
  expect(await screen.findByText('Popular Movie')).toBeInTheDocument();
});

test('opens the playlist section and creates a playlist', async () => {
  window.localStorage.removeItem('local-movie-playlists');
  getMovieList.mockResolvedValue([]);
  getTopRatedMovies.mockResolvedValue([]);

  render(<App />);

  fireEvent.click(screen.getByRole('button', { name: 'Playlist' }));
  expect(screen.getByRole('heading', { name: 'Playlist Saya' })).toBeInTheDocument();
  expect(
    await screen.findByText(
      'Pilih playlist atau buat playlist baru untuk mulai mengatur film.',
    ),
  ).toBeInTheDocument();
  expect(screen.getByText('Belum ada playlist')).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText('Nama playlist baru'), {
    target: { value: 'Film akhir pekan' },
  });
  fireEvent.click(screen.getByRole('button', { name: /buat playlist/i }));

  expect(
    screen.getByRole('button', { name: /film akhir pekan.*0 film/i }),
  ).toBeInTheDocument();
});

test('opens movie details in a new browser tab', async () => {
  const movie = {
    id: 42,
    title: 'Detail Movie',
    poster_path: '/detail.jpg',
    release_date: '2025-02-03',
    vote_average: 8.1,
  };
  getMovieList.mockResolvedValue([movie]);
  getTopRatedMovies.mockResolvedValue([]);
  const openTab = jest.spyOn(window, 'open').mockImplementation(() => null);

  render(<App />);
  const detailButtons = await screen.findAllByRole('button', {
    name: 'Lihat detail Detail Movie',
  });
  fireEvent.click(detailButtons[0]);

  expect(openTab).toHaveBeenCalledWith(
    expect.stringContaining('movie=42'),
    '_blank',
    'noopener,noreferrer',
  );

  openTab.mockRestore();
});

test('loads movie details when opened with a movie id', async () => {
  const previousUrl = window.location.href;
  getMovieDetails.mockResolvedValue({
    id: 42,
    title: 'Detail Movie',
    original_title: 'Detail Movie',
    overview: 'A story about a test movie.',
    poster_path: '/detail.jpg',
    backdrop_path: '/backdrop.jpg',
    vote_average: 8.1,
    vote_count: 120,
    release_date: '2025-02-03',
    runtime: 110,
    original_language: 'en',
    budget: 1000000,
    revenue: 2000000,
    status: 'Released',
    genres: [{ id: 1, name: 'Drama' }],
  });
  window.history.pushState({}, '', '/?movie=42');

  render(<App />);

  expect(await screen.findByRole('heading', { name: 'Detail Movie' })).toBeInTheDocument();
  expect(screen.getByText('A story about a test movie.')).toBeInTheDocument();
  expect(screen.getByText('Drama')).toBeInTheDocument();
  expect(getMovieDetails).toHaveBeenCalledWith('42');

  const closeTab = jest.spyOn(window, 'close').mockImplementation(() => {});
  fireEvent.click(screen.getByRole('button', { name: 'Tutup detail' }));
  expect(closeTab).toHaveBeenCalledTimes(1);
  closeTab.mockRestore();

  window.history.replaceState({}, '', new URL(previousUrl).pathname + new URL(previousUrl).search);
});
