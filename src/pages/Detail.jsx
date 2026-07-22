import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchGristRecords } from '../api/grist'
import { GRIST_TABLES } from '../config.js'

export default function Detail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [article, setArticle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadArticle = async () => {
      try {
        const data = await fetchGristRecords(GRIST_TABLES.ARTICLE, { id_article: id })
        const foundArticle = Array.isArray(data) ? data[0] : data

        if (!foundArticle) {
          setError('Article non trouvé')
          return
        }

        setArticle(foundArticle)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadArticle()
  }, [id])

  if (loading) {
    return (
      <div className="detail-page">
        <div className="detail-banner-section">
          <div className="skeleton skeleton-line skeleton-banner-title" />
        </div>

        <div className="skeleton skeleton-banner-image" />

        <main className="detail-content-wrapper">
          <div className="skeleton skeleton-line" />
          <div className="skeleton skeleton-line" />
          <div className="skeleton skeleton-line" style={{ width: '95%' }} />
          <div className="skeleton skeleton-line" style={{ width: '90%' }} />
          <div className="skeleton skeleton-line" style={{ width: '70%' }} />
        </main>
      </div>
    )
  }
  if (error) return <div className="error">Erreur: {error}</div>
  if (!article) return <div className="error">Article non trouvé</div>

  const { Titre, Image_Banner_Url, Contenu } = article

  return (
    <div className="detail-page">
      <div className="detail-banner-section">
        <h1>{Titre || 'Sans titre'}</h1>
      </div>

      {Image_Banner_Url && (
        <img src={Image_Banner_Url} alt={Titre} className="detail-article-image" />
      )}

      <main className="detail-content-wrapper">
        <button onClick={() => navigate(-1)} className="back-button">
          ← Retour
        </button>

        <article className="detail-article">
          {Contenu && <p>{Contenu}</p>}
        </article>
      </main>

      <footer className="detail-footer">
        <div className="footer-content">
          <p>© 2026 - Tous droits réservés</p>
        </div>
      </footer>
    </div>
  )
}
