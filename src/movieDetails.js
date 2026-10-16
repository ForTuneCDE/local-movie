
import { useEffect, useState } from "react"
import { getMovieDetails } from "./api"
import "./MovieDetail.css"

const formatCurrency = (amount) =>
  amount
    ? new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0
      }).format(amount)
    : "Tidak tersedia"

function MovieDetail({ movieId }) {
  const [movie, setMovie] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let isMounted = true

    if (!/^\d+$/.test(movieId)) {
      setError("ID film tidak valid.")
      setLoading(false)
      return undefined
    }

    getMovieDetails(movieId)
      .then((data) => {
        if (isMounted) setMovie(data)
      })
      .catch((requestError) => {
        console.error("Gagal mengambil detail film:", requestError)
        if (isMounted) setError("Gagal mengambil detail film. Coba lagi nanti.")
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [movieId])

  const closeTab = () => {
    window.close()
  }

  if (loading) {
    return (
      <main className="Movie-detail-page">
        <div className="Movie-detail-message" role="status">
          <span className="Movie-detail-spinner" aria-hidden="true" />
          Memuat detail film...
        </div>
      </main>
    )
  }

  if (error || !movie) {
    return (
      <main className="Movie-detail-page">
        <div className="Movie-detail-message" role="alert">
          <span className="Movie-detail-message-icon" aria-hidden="true">
            !
          </span>
          <h1>{error || "Film tidak ditemukan."}</h1>
          <button type="button" onClick={closeTab}>
            Tutup tab
          </button>
        </div>
      </main>
    )
  }

  const imageBase = process.env.REACT_APP_IMG_URL
  const rating = Number.isFinite(movie.vote_average)
    ? `${movie.vote_average.toFixed(1)}/10`
    : "Belum tersedia"
  const releaseYear = movie.release_date?.slice(0, 4)

  return (
    <main className="Movie-detail-page">
      <div
        className="Movie-detail-backdrop"
        style={
          movie.backdrop_path
            ? {
                backgroundImage: `url("${imageBase}/${movie.backdrop_path}")`
              }
            : undefined
        }
        aria-hidden="true"
      />
      <div className="Movie-detail-content">
        <button
          className="Movie-detail-back-button"
          type="button"
          onClick={closeTab}
        >
          <span aria-hidden="true">←</span>
          Tutup detail
        </button>

        <section className="Movie-detail-hero">
          {movie.poster_path ? (
            <img
              className="Movie-detail-poster"
              src={`${imageBase}/${movie.poster_path}`}
              alt={`Poster ${movie.title}`}
            />
          ) : (
            <div className="Movie-detail-poster Movie-detail-poster-empty">
              🎬
            </div>
          )}

          <div className="Movie-detail-summary">
            <span className="Movie-detail-eyebrow">
              {releaseYear || "FILM"}
              {movie.status ? ` · ${movie.status}` : ""}
            </span>
            <h1>{movie.title}</h1>
            {movie.original_title !== movie.title && (
              <p className="Movie-detail-original-title">
                Judul asli: {movie.original_title}
              </p>
            )}
            {movie.tagline && (
              <p className="Movie-detail-tagline">“{movie.tagline}”</p>
            )}

            <div className="Movie-detail-genres">
              {movie.genres?.map((genre) => (
                <span key={genre.id}>{genre.name}</span>
              ))}
            </div>

            <div className="Movie-detail-rating">
              <span aria-hidden="true">★</span>
              <strong>{rating}</strong>
              <span className="Movie-detail-vote-count">
                {movie.vote_count
                  ? `${new Intl.NumberFormat("id-ID").format(movie.vote_count)} suara`
                  : "Rating TMDB"}
              </span>
            </div>
          </div>
        </section>

        <section className="Movie-detail-information">
          <div className="Movie-detail-overview">
            <span className="Movie-detail-eyebrow">SINOPSIS</span>
            <h2>Cerita film</h2>
            <p>{movie.overview || "Sinopsis belum tersedia."}</p>
          </div>

          <dl className="Movie-detail-facts">
            <div>
              <dt>Tanggal rilis</dt>
              <dd>{movie.release_date || "Tidak tersedia"}</dd>
            </div>
            <div>
              <dt>Durasi</dt>
              <dd>{movie.runtime ? `${movie.runtime} menit` : "Tidak tersedia"}</dd>
            </div>
            <div>
              <dt>Bahasa asli</dt>
              <dd>{movie.original_language?.toUpperCase() || "Tidak tersedia"}</dd>
            </div>
            <div>
              <dt>Anggaran</dt>
              <dd>{formatCurrency(movie.budget)}</dd>
            </div>
            <div>
              <dt>Pendapatan</dt>
              <dd>{formatCurrency(movie.revenue)}</dd>
            </div>
          </dl>
        </section>
      </div>
    </main>
  )
}

export default MovieDetail
