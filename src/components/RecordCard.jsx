export function RecordCard({ title, description, imageUrl }) {
  return (
    <div className="record-card">
      {imageUrl && (
        <img src={imageUrl} alt={title} className="record-image" />
      )}
      <div className="record-content">
        <h3>{title || 'Sans titre'}</h3>
        {description && <p>{description}</p>}
        <a href="#" className="learn-more">En savoir plus</a>
      </div>
    </div>
  );
}
