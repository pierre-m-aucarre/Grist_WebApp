import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchGristRecords } from '../api/grist'
import { RecordCard } from '../components/RecordCard'
import { SkeletonCard } from '../components/SkeletonCard'
import { GRIST_TABLES } from '../config.js'

export default function Home() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const loadRecords = async () => {
      try {
        const data = await fetchGristRecords(GRIST_TABLES.HOME)
        setRecords(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadRecords()
  }, [])

  const handleCardClick = (articleId) => {
    navigate(`/article/${articleId}`)
  }

  if (error) return <div className="error">Erreur: {error}</div>

  return (
    <main className="app">
      <h1>Les actualités à ne pas manquer</h1>
      <div className="records-grid">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          : records.map((record) => (
              <div
                key={record.id}
                onClick={() => handleCardClick(record.Article)}
                className="clickable-card"
              >
                <RecordCard
                  title={record.Title}
                  description={record.Description}
                  imageUrl={record.Image_Url}
                />
              </div>
            ))}
      </div>
    </main>
  )
}
