import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchGristRecords } from '../api/grist'
import { RecordCard } from '../components/RecordCard'

export default function Home() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const loadRecords = async () => {
      try {
        const data = await fetchGristRecords('Home')
        setRecords(data.records)
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

  if (loading) return <div className="loading">Chargement...</div>
  if (error) return <div className="error">Erreur: {error}</div>

  return (
    <main className="app">
      <h1>Les actualités à ne pas manquer</h1>
      <div className="records-grid">
        {records.map((record) => (
          <div
            key={record.id}
            onClick={() => handleCardClick(record.fields.Article)}
            className="clickable-card"
          >
            <RecordCard
              title={record.fields.Title}
              description={record.fields.Description}
              imageUrl={record.fields.Image_Url}
            />
          </div>
        ))}
      </div>
    </main>
  )
}
