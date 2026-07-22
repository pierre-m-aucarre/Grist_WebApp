export function SkeletonCard() {
  return (
    <div className="record-card">
      <div className="record-image skeleton" />
      <div className="record-content">
        <div className="skeleton skeleton-line skeleton-title" />
        <div className="skeleton skeleton-line" />
        <div className="skeleton skeleton-line" style={{ width: '80%' }} />
      </div>
    </div>
  )
}
