const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2
}).format(amount);

const formatDate = (date) => new Date(date).toLocaleDateString('en-IN');

const LedgerEntryCard = ({ entry, currentRole, onApprove, onDispute, onQuickEdit, onCorrection }) => {
  const myApproval = entry.approvals?.[currentRole]?.status || 'pending';

  return (
    <article className="entry-card">
      <div className="entry-head">
        <h4>{entry.itemName}</h4>
        <span className={`status-pill ${entry.status}`}>{entry.status}</span>
      </div>

      <p>
        {entry.quantity} {entry.unit} x {formatCurrency(entry.pricePerUnit)} ={' '}
        <strong>{formatCurrency(entry.totalAmount)}</strong>
      </p>
      <p>Date: {formatDate(entry.entryDate)}</p>
      <p>
        Added by: {entry.createdBy?.name || 'Unknown'} ({entry.createdBy?.role || 'user'})
      </p>
      <p>Type: {entry.type}</p>
      <p>Version: {entry.version}</p>
      {entry.notes ? <p>Notes: {entry.notes}</p> : null}
      {entry.type === 'correction' && entry.linkedEntry ? <p>Correction of: {entry.linkedEntry}</p> : null}
      <p>
        Approvals: Buyer {entry.approvals?.buyer?.status || 'pending'} | Seller{' '}
        {entry.approvals?.seller?.status || 'pending'}
      </p>
      <p>Your side: {myApproval}</p>

      <div className="action-row">
        {entry.status !== 'approved' ? (
          <>
            <button onClick={() => onApprove(entry._id)}>Approve</button>
            <button className="warn" onClick={() => onDispute(entry._id)}>
              Dispute
            </button>
            <button className="ghost" onClick={() => onQuickEdit(entry)}>
              Edit (Reset approvals)
            </button>
          </>
        ) : (
          <button className="ghost" onClick={() => onCorrection(entry)}>
            Create Correction
          </button>
        )}
      </div>

      {entry.history?.length ? (
        <details>
          <summary>History ({entry.history.length})</summary>
          {entry.history.map((log) => (
            <p key={`${entry._id}-${log.version}`}>
              v{log.version}: {log.reason || 'No reason'}
            </p>
          ))}
        </details>
      ) : null}
    </article>
  );
};

export default LedgerEntryCard;
