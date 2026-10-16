import "./App.css"
import { useEffect, useState } from "react"
import MovieDetail from "./movieDetails"
import { getMovieList, getTopRatedMovies, searchMovie } from "./api"

const STORAGE_KEYS = {
  favorites: "local-movie-favorites",
  playlists: "local-movie-playlists"
}

const getStoredValue = (key, fallbackValue) => {
  if (typeof window === "undefined") {
    return fallbackValue
  }

  try {
    const storedValue = window.localStorage.getItem(key)
    return storedValue ? JSON.parse(storedValue) : fallbackValue
  } catch {
    return fallbackValue
  }
}

const MovieCatalog = () => {
  const [popularMovies, setPopularMovies] = useState([])
  const [topRatedMovies, setTopRatedMovies] = useState([])
  const [activeMovieList, setActiveMovieList] = useState("popular")
  const [favorites, setFavorites] = useState(() =>
    getStoredValue(STORAGE_KEYS.favorites, [])
  )
  const [playlists, setPlaylists] = useState(() =>
    getStoredValue(STORAGE_KEYS.playlists, [])
  )
  const [favoriteNotification, setFavoriteNotification] = useState("")
  const [newPlaylistName, setNewPlaylistName] = useState("")
  const [activePlaylistId, setActivePlaylistId] = useState("")
  const [movieToAddToPlaylist, setMovieToAddToPlaylist] = useState(null)

  useEffect(() => {
    getMovieList()
      .then((result) => {
        setPopularMovies(result)
      })
      .catch((error) => {
        console.error("Gagal Mengambil Film:", error)
      })

    getTopRatedMovies()
      .then((result) => {
        setTopRatedMovies(result)
      })
      .catch((error) => {
        console.error("Gagal Top Rated:", error.response?.data || error.message)
      })
  }, [])

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        STORAGE_KEYS.favorites,
        JSON.stringify(favorites)
      )
    }
  }, [favorites])

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        STORAGE_KEYS.playlists,
        JSON.stringify(playlists)
      )
    }
  }, [playlists])

  useEffect(() => {
    if (!favoriteNotification) {
      return undefined
    }

    const timeoutId = setTimeout(() => {
      setFavoriteNotification("")
    }, 3000)

    return () => clearTimeout(timeoutId)
  }, [favoriteNotification])

  useEffect(() => {
    if (!movieToAddToPlaylist) return undefined

    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setMovieToAddToPlaylist(null)
      }
    }

    window.addEventListener("keydown", closeOnEscape)
    return () => window.removeEventListener("keydown", closeOnEscape)
  }, [movieToAddToPlaylist])

  const activePlaylist = playlists.find(
    (playlist) => playlist.id === activePlaylistId
  )

  const moviesToDisplay =
    activeMovieList === "favorites"
      ? favorites
      : activeMovieList === "topRated"
        ? topRatedMovies
        : activeMovieList === "watchlist"
          ? activePlaylist?.movies || []
          : popularMovies

  const toggleFavorite = (movie) => {
    const isFavorite = favorites.some((item) => item.id === movie.id)

    setFavorites((previous) =>
      isFavorite
        ? previous.filter((item) => item.id !== movie.id)
        : [...previous, movie]
    )

    setFavoriteNotification(
      isFavorite
        ? `${movie.title} dihapus dari favorit`
        : `${movie.title} ditambahkan ke favorit`
    )
  }

  const createPlaylist = (event) => {
    event.preventDefault()

    const name = newPlaylistName.trim()
    if (!name) return

    const playlist = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      movies: []
    }

    setPlaylists((previous) => [...previous, playlist])
    setNewPlaylistName("")
    setActivePlaylistId(playlist.id)
    setActiveMovieList("watchlist")
  }

  const addToPlaylist = (movie, playlistId) => {
    if (!playlistId) {
      setFavoriteNotification("Pilih playlist dulu yaa")
      return
    }

    setPlaylists((previous) =>
      previous.map((playlist) => {
        if (playlist.id !== playlistId) {
          return playlist
        }

        if (playlist.movies.some((item) => item.id === movie.id)) {
          setFavoriteNotification("Film nya sudah ada di playlist")
          return playlist
        }

        setFavoriteNotification(`${movie.title} ditambahkan ke playlist`)
        return {
          ...playlist,
          movies: [...playlist.movies, movie]
        }
      })
    )
  }

  const openPlaylistManager = () => {
    setActiveMovieList("watchlist")
  }

  const deletePlaylist = (playlistId) => {
    setPlaylists((previous) =>
      previous.filter((playlist) => playlist.id !== playlistId)
    )

    if (activePlaylistId === playlistId) {
      setActivePlaylistId("")
      setActiveMovieList("popular")
    }
  }

  const openMovieDetails = (movie) => {
    const detailsUrl = new URL(window.location.href)
    detailsUrl.searchParams.set("movie", movie.id)
    window.open(detailsUrl.toString(), "_blank", "noopener,noreferrer")
  }

  const renderMovies = (movies, emptyMessage) => {
    if (!movies || movies.length === 0) {
      return (
        <div className="Movie-empty-state" role="status">
          <span className="Movie-empty-icon" aria-hidden="true">
            🎬
          </span>
          <p>{emptyMessage}</p>
        </div>
      )
    }

    return movies.map((movie) => {
      const isFavorite = favorites.some((item) => item.id === movie.id)

      return (
        <div className="Movie-wrapper" key={movie.id}>
          <button
            type="button"
            className="Movie-title Movie-detail-trigger"
            onClick={() => openMovieDetails(movie)}
            aria-label={`Lihat detail ${movie.title}`}
          >
            {movie.title}
          </button>

          <div className="Movie-poster">
            <button
              type="button"
              className="Movie-poster-trigger"
              onClick={() => openMovieDetails(movie)}
              aria-label={`Lihat detail ${movie.title}`}
            >
              <img
                className="Movie-image"
                src={
                  movie.poster_path
                    ? `${process.env.REACT_APP_IMG_URL}/${movie.poster_path}`
                    : ""
                }
                alt=""
              />
            </button>

            <button
              className={`Favorite-Button ${isFavorite ? "is-favorite" : ""}`}
              onClick={() => toggleFavorite(movie)}
              title={isFavorite ? "Hapus Favorit" : "Tambahkan Favorit"}
            >
              {isFavorite ? "♥" : "♡"}
            </button>
          </div>

          <div className="Movie-date">
            Release: {movie.release_date || "Belum tersedia"}
          </div>

          <div className="Movie-rate">
            <span className="Movie-rate-star" aria-hidden="true">
              ★
            </span>
            {Number.isFinite(movie.vote_average)
              ? `${(Math.round(movie.vote_average * 10) / 10).toFixed(1)}/10`
              : "—/10"}
          </div>

          <div className="playlist-add">
            {playlists.length === 0 ? (
              <button
                type="button"
                className="Playlist-toggle-button"
                onClick={openPlaylistManager}
              >
                <span className="Playlist-add-icon" aria-hidden="true">
                  +
                </span>
                Buat playlist
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="Playlist-toggle-button"
                  aria-haspopup="dialog"
                  onClick={() => setMovieToAddToPlaylist(movie)}
                >
                  <span className="Playlist-add-icon" aria-hidden="true">
                    +
                  </span>
                  Tambah ke playlist
                </button>
              </>
            )}
          </div>
        </div>
      )
    })
  }

  async function search(query) {
    const trimmedQuery = query.trim()
    if (trimmedQuery.length <= 3) return

    try {
      const result = await searchMovie(trimmedQuery)
      setPopularMovies(result.results)
    } catch (error) {
      console.error("Gagal Mencari Film:", error)
    }
  }

  return (
    <div className="App">
      <header className="App-header">
        <button
          className="Back-button"
          onClick={() => {
            setActiveMovieList("popular")
            setActivePlaylistId("")
          }}
          aria-label="Kembali ke daftar film"
        >
          <span aria-hidden="true">←</span>
          <span>Kembali</span>
        </button>

        <h1>LocalMovie</h1>

        <nav className="Movie-list-controls" aria-label="Kategori film">
          <button
            className={`Favorites-toggle${
              activeMovieList === "favorites" ? " is-active" : ""
            }`}
            onClick={() =>
              setActiveMovieList(
                activeMovieList === "favorites" ? "popular" : "favorites"
              )
            }
            aria-pressed={activeMovieList === "favorites"}
          >
            <span className="Favorites-toggle-icon" aria-hidden="true">
              {activeMovieList === "favorites" ? "▦" : "♥"}
            </span>
            <span>
              {activeMovieList === "favorites" ? "Semua Film" : "Favorit"}
            </span>
            {activeMovieList !== "favorites" && (
              <span className="Favorites-toggle-count">{favorites.length}</span>
            )}
          </button>
          <button
            className={`TopRated-toggle${
              activeMovieList === "watchlist" ? " is-active" : ""
            }`}
            onClick={() => setActiveMovieList("watchlist")}
            aria-pressed={activeMovieList === "watchlist"}
          >
            <span className="Playlist-icon" aria-hidden="true">
              <svg viewBox="0 0 20 20" focusable="false">
                <path d="M7 5h10M7 10h10M7 15h10" />
                <circle cx="3.5" cy="5" r=".75" />
                <circle cx="3.5" cy="10" r=".75" />
                <circle cx="3.5" cy="15" r=".75" />
              </svg>
            </span>
            <span>Playlist</span>
          </button>
        </nav>

        <input
          placeholder="Cari Film....."
          className="Movie-search"
          onChange={({ target }) => search(target.value)}
        />

        <div className="Movie-list-toolbar">
          <button
            className={`TopRated-toggle${
              activeMovieList === "topRated" ? " is-active" : ""
            }`}
            onClick={() => setActiveMovieList("topRated")}
            aria-pressed={activeMovieList === "topRated"}
          >
            <span aria-hidden="true">★</span>
            <span>Top Rated</span>
          </button>
        </div>

        {activeMovieList === "watchlist" && (
          <section className="Watchlist-panel">
            <div className="Watchlist-heading">
              <div className="Watchlist-heading-copy">
                <span className="Watchlist-eyebrow">KOLEKSI PRIBADI</span>
                <h2>Playlist Saya</h2>
                <p>Simpan dan atur film yang ingin kamu tonton.</p>
              </div>
              <span className="Watchlist-total">
                <strong>{playlists.length}</strong>
                <span>playlist</span>
              </span>
            </div>

            <form className="Playlist-create-form" onSubmit={createPlaylist}>
              <label className="visually-hidden" htmlFor="new-playlist-name">
                Nama playlist baru
              </label>
              <input
                id="new-playlist-name"
                type="text"
                placeholder="Contoh: Film akhir pekan"
                value={newPlaylistName}
                onChange={(event) => setNewPlaylistName(event.target.value)}
              />

              <button type="submit">
                <span aria-hidden="true">+</span>
                Buat playlist
              </button>
            </form>

            <div className="Playlist-list">
              {playlists.length === 0 ? (
                <div className="Playlist-empty">
                  <span aria-hidden="true">▤</span>
                  <strong>Belum ada playlist</strong>
                  <p>Buat playlist pertamamu untuk mulai mengatur film favorit.</p>
                </div>
              ) : (
                playlists.map((playlist) => (
                  <div
                    key={playlist.id}
                    className={`Playlist-item${
                      activePlaylistId === playlist.id ? " is-active" : ""
                    }`}
                  >
                    <button
                      type="button"
                      className="Playlist-button"
                      aria-pressed={activePlaylistId === playlist.id}
                      onClick={() => {
                        setActivePlaylistId(playlist.id)
                        setActiveMovieList("watchlist")
                      }}
                    >
                      <span className="Playlist-card-icon" aria-hidden="true">
                        ▤
                      </span>
                      <span className="Playlist-card-copy">
                        <strong>{playlist.name}</strong>
                        <span>{playlist.movies.length} film</span>
                      </span>
                      <span className="Playlist-preview" aria-hidden="true">
                        {playlist.movies.slice(0, 3).map((movie) =>
                          movie.poster_path ? (
                            <img
                              key={movie.id}
                              src={`${process.env.REACT_APP_IMG_URL}/${movie.poster_path}`}
                              alt=""
                            />
                          ) : (
                            <span key={movie.id} className="Playlist-preview-placeholder">
                              🎬
                            </span>
                          )
                        )}
                        {playlist.movies.length === 0 && (
                          <span className="Playlist-preview-placeholder">
                            +
                          </span>
                        )}
                      </span>
                    </button>

                    <button
                      type="button"
                      className="Playlist-remove-button"
                      onClick={(event) => {
                        event.stopPropagation()
                        deletePlaylist(playlist.id)
                      }}
                      aria-label={`Hapus playlist ${playlist.name}`}
                      title={`Hapus ${playlist.name}`}
                    >
                      <svg viewBox="0 0 20 20" aria-hidden="true">
                        <path d="M4 6h12M8 6V4h4v2m-6 0 1 10h6l1-10M9 9v4m2-4v4" />
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        <div className="Movie-container">
          {renderMovies(
            moviesToDisplay,
            activeMovieList === "favorites"
              ? "Belum Ada Film Favorit"
              : activeMovieList === "watchlist" &&
                activePlaylistId &&
                activePlaylist
              ? "Playlist ini belum memiliki film"
              : activeMovieList === "watchlist"
                ? "Pilih playlist atau buat playlist baru untuk mulai mengatur film."
                : "Film tidak ditemukan. Coba kata kunci pencarian lain."
          )}
        </div>

        {movieToAddToPlaylist && (
          <div
            className="Playlist-modal-backdrop"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setMovieToAddToPlaylist(null)
              }
            }}
          >
            <section
              className="Playlist-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="Playlist-modal-title"
            >
              <button
                type="button"
                className="Playlist-modal-close"
                onClick={() => setMovieToAddToPlaylist(null)}
                aria-label="Tutup pilihan playlist"
              >
                ×
              </button>

              <span className="Playlist-modal-icon" aria-hidden="true">
                +
              </span>
              <h2 id="Playlist-modal-title">Tambah ke playlist</h2>
              <p className="Playlist-modal-movie-title">
                {movieToAddToPlaylist.title}
              </p>

              <div className="Playlist-modal-options">
                {playlists.map((playlist) => (
                  <button
                    key={playlist.id}
                    type="button"
                    className="Playlist-modal-option"
                    onClick={() => {
                      addToPlaylist(movieToAddToPlaylist, playlist.id)
                      setMovieToAddToPlaylist(null)
                    }}
                  >
                    <span>{playlist.name}</span>
                    <span className="Playlist-modal-option-count">
                      {playlist.movies.length} film
                    </span>
                  </button>
                ))}
              </div>
            </section>
          </div>
        )}

        {favoriteNotification && (
          <div className="Favorite-notification" role="status" aria-live="polite">
            {favoriteNotification}
          </div>
        )}
      </header>
    </div>
  )
}

const App = () => {
  const movieId = new URLSearchParams(window.location.search).get("movie")

  return movieId ? <MovieDetail movieId={movieId} /> : <MovieCatalog />
}

export default App
