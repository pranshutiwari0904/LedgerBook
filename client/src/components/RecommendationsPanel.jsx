const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(amount || 0);

const formatDate = (date) => {
  if (!date) {
    return 'No previous date';
  }

  return new Date(date).toLocaleDateString('en-IN');
};

const confidenceText = (value) => `${Math.round((value || 0) * 100)}%`;

const RecommendationsPanel = ({ recommendations, onQuickAdd, onSaveShortcut }) => {
  return (
    <section className="panel recommendations-panel">
      <div className="panel-head">
        <h3>Smart Recommendations</h3>
        <span className="badge">Based on your history</span>
      </div>

      {recommendations.length === 0 ? (
        <p className="muted-text">No recommendations yet. Add approved entries first.</p>
      ) : (
        <div className="recommendation-grid">
          {recommendations.map((item) => (
            <article
              key={`${item.itemName}-${item.unit}-${item.source}`}
              className="recommendation-card"
            >
              <h4>{item.itemName}</h4>
              <p>
                Suggested: <strong>{item.suggestedQuantity}</strong> {item.unit}
              </p>
              <p>Expected price: {formatCurrency(item.suggestedPricePerUnit)}</p>
              <p>Confidence: {confidenceText(item.confidence)}</p>
              <p>Last used: {formatDate(item.lastPurchasedAt)}</p>

              <div className="action-row">
                <button onClick={() => onQuickAdd(item)}>Quick Add</button>
                <button className="ghost" onClick={() => onSaveShortcut(item)}>
                  Save Shortcut
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default RecommendationsPanel;
