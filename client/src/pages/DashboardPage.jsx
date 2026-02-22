import { useCallback, useEffect, useState } from 'react';
import { ledgerApi } from '../api/client';
import AutomationPanel from '../components/AutomationPanel';
import EntryForm from '../components/EntryForm';
import LedgerEntryCard from '../components/LedgerEntryCard';
import RecommendationsPanel from '../components/RecommendationsPanel';
import ShortcutsPanel from '../components/ShortcutsPanel';
import ThemeCustomizer from '../components/ThemeCustomizer';
import { useAuth } from '../context/AuthContext';

const currentMonth = new Date().toISOString().slice(0, 7);

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(amount || 0);

const buildCsvContent = (entries) => {
  const header = [
    'Date',
    'Item',
    'Quantity',
    'Unit',
    'PricePerUnit',
    'Total',
    'Status',
    'Type',
    'CreatedBy',
    'Notes'
  ];
  const lines = entries.map((entry) => {
    const values = [
      new Date(entry.entryDate).toISOString().slice(0, 10),
      entry.itemName,
      entry.quantity,
      entry.unit,
      entry.pricePerUnit,
      entry.totalAmount,
      entry.status,
      entry.type,
      entry.createdBy?.name || '',
      entry.notes || ''
    ];

    return values
      .map((value) => {
        const safe = String(value ?? '').replace(/"/g, '""');
        return `"${safe}"`;
      })
      .join(',');
  });

  return [header.join(','), ...lines].join('\n');
};

const DashboardPage = () => {
  const { user, token, logout } = useAuth();

  const [month, setMonth] = useState(currentMonth);
  const [statusFilter, setStatusFilter] = useState('all');

  const [entries, setEntries] = useState([]);
  const [summary, setSummary] = useState(null);
  const [shortcuts, setShortcuts] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [automations, setAutomations] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRunningAutomations, setIsRunningAutomations] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadWorkspace = useCallback(async () => {
    if (!token) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const [entriesResponse, summaryResponse, shortcutsResponse, recommendationsResponse, automationsResponse] =
        await Promise.all([
          ledgerApi.listEntries(token, { month, status: statusFilter }),
          ledgerApi.getSummary(token, month),
          ledgerApi.listShortcuts(token),
          ledgerApi.getRecommendations(token, 8),
          ledgerApi.listAutomations(token)
        ]);

      setEntries(entriesResponse.entries);
      setSummary(summaryResponse.summary);
      setShortcuts(shortcutsResponse.shortcuts);
      setRecommendations(recommendationsResponse.recommendations);
      setAutomations(automationsResponse.automations);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [token, month, statusFilter]);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  const createEntry = async (payload) => {
    setIsSubmitting(true);
    setError('');
    setNotice('');

    try {
      await ledgerApi.createEntry(token, payload);
      setNotice('Entry added successfully.');
      await loadWorkspace();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const approveEntry = async (entryId) => {
    setError('');
    setNotice('');

    try {
      const note = window.prompt('Optional note for approval:') || '';
      await ledgerApi.decideEntry(token, entryId, { decision: 'approve', note });
      setNotice('Entry approved.');
      await loadWorkspace();
    } catch (err) {
      setError(err.message);
    }
  };

  const disputeEntry = async (entryId) => {
    setError('');
    setNotice('');

    try {
      const note = window.prompt('Why are you disputing this entry?', 'Amount/date mismatch') || '';
      await ledgerApi.decideEntry(token, entryId, { decision: 'dispute', note });
      setNotice('Entry marked as disputed.');
      await loadWorkspace();
    } catch (err) {
      setError(err.message);
    }
  };

  const quickEditEntry = async (entry) => {
    const itemName = window.prompt('Item name', entry.itemName);
    if (!itemName) {
      return;
    }

    const quantity = window.prompt('Quantity', entry.quantity);
    if (quantity === null) {
      return;
    }

    const pricePerUnit = window.prompt('Price per unit', entry.pricePerUnit);
    if (pricePerUnit === null) {
      return;
    }

    const reason = window.prompt('Edit reason (saved in history)', 'Correcting wrong amount') || '';

    try {
      await ledgerApi.editEntry(token, entry._id, {
        itemName,
        quantity: Number(quantity),
        unit: entry.unit,
        pricePerUnit: Number(pricePerUnit),
        entryDate: entry.entryDate,
        notes: entry.notes,
        reason
      });
      setNotice('Entry updated and approvals reset.');
      await loadWorkspace();
    } catch (err) {
      setError(err.message);
    }
  };

  const createCorrection = async (entry) => {
    const itemName = window.prompt('Correction item name', `${entry.itemName} (Correction)`);
    if (!itemName) {
      return;
    }

    const quantity = window.prompt('Correction quantity', entry.quantity);
    if (quantity === null) {
      return;
    }

    const pricePerUnit = window.prompt('Correction price per unit', entry.pricePerUnit);
    if (pricePerUnit === null) {
      return;
    }

    const notes = window.prompt('Reason for correction', 'Price correction') || '';

    try {
      await ledgerApi.createCorrection(token, entry._id, {
        itemName,
        quantity: Number(quantity),
        unit: entry.unit,
        pricePerUnit: Number(pricePerUnit),
        entryDate: new Date().toISOString().slice(0, 10),
        notes
      });
      setNotice('Correction entry created.');
      await loadWorkspace();
    } catch (err) {
      setError(err.message);
    }
  };

  const downloadCsv = () => {
    if (entries.length === 0) {
      setError('No entries to export for selected filters.');
      return;
    }

    const content = buildCsvContent(entries);
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ledger-${month}-${statusFilter}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const quickAddFromRecommendation = async (item) => {
    try {
      await ledgerApi.createEntry(token, {
        itemName: item.itemName,
        quantity: item.suggestedQuantity,
        unit: item.unit,
        pricePerUnit: item.suggestedPricePerUnit,
        entryDate: new Date().toISOString().slice(0, 10),
        notes: `Suggested from ${item.source}`
      });
      setNotice(`${item.itemName} added from recommendation.`);
      await loadWorkspace();
    } catch (err) {
      setError(err.message);
    }
  };

  const saveRecommendationAsShortcut = async (item) => {
    try {
      await ledgerApi.createShortcut(token, {
        name: `${item.itemName} Quick`,
        itemName: item.itemName,
        quantity: item.suggestedQuantity,
        unit: item.unit,
        pricePerUnit: item.suggestedPricePerUnit,
        notes: `Saved from ${item.source} recommendation`,
        isFavorite: false
      });
      setNotice(`Shortcut saved for ${item.itemName}.`);
      await loadWorkspace();
    } catch (err) {
      setError(err.message);
    }
  };

  const createShortcut = async (payload) => {
    try {
      await ledgerApi.createShortcut(token, payload);
      setNotice('Shortcut created.');
      await loadWorkspace();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  };

  const useShortcut = async (shortcutId) => {
    try {
      await ledgerApi.useShortcut(token, shortcutId, {
        entryDate: new Date().toISOString().slice(0, 10)
      });
      setNotice('Entry created from shortcut.');
      await loadWorkspace();
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleShortcutFavorite = async (shortcut) => {
    try {
      await ledgerApi.updateShortcut(token, shortcut._id, {
        isFavorite: !shortcut.isFavorite
      });
      await loadWorkspace();
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteShortcut = async (shortcutId) => {
    const ok = window.confirm('Delete this shortcut?');
    if (!ok) {
      return;
    }

    try {
      await ledgerApi.deleteShortcut(token, shortcutId);
      setNotice('Shortcut deleted.');
      await loadWorkspace();
    } catch (err) {
      setError(err.message);
    }
  };

  const createAutomation = async (payload) => {
    try {
      await ledgerApi.createAutomation(token, payload);
      setNotice('Automation created.');
      await loadWorkspace();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  };

  const toggleAutomation = async (automation) => {
    try {
      await ledgerApi.updateAutomation(token, automation._id, {
        active: !automation.active
      });
      await loadWorkspace();
    } catch (err) {
      setError(err.message);
    }
  };

  const runDueAutomations = async () => {
    setIsRunningAutomations(true);
    setError('');

    try {
      const response = await ledgerApi.runAutomations(token);
      setNotice(`${response.createdCount} entries created from due automations.`);
      await loadWorkspace();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsRunningAutomations(false);
    }
  };

  return (
    <main className="dashboard-shell">
      <header className="dash-header panel">
        <div>
          <h1 className="brand-title">
            <span className="brand-logo">LedgerBook</span> Workspace
          </h1>
          <p>
            Logged in as <strong>{user?.name}</strong> ({user?.role}) | Group: <strong>{user?.groupCode}</strong>
          </p>
        </div>

        <div className="header-actions">
          <label>
            Month
            <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
          </label>
          <label>
            Status
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="disputed">Disputed</option>
            </select>
          </label>
          <button className="ghost" onClick={downloadCsv}>
            Download CSV
          </button>
          <button className="ghost" onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      {error ? <p className="error-text">{error}</p> : null}
      {notice ? <p className="ok-text">{notice}</p> : null}

      <section className="summary-grid">
        <article className="panel summary-card">
          <p>Total</p>
          <h3>{formatCurrency(summary?.totalAmount)}</h3>
        </article>
        <article className="panel summary-card">
          <p>Approved</p>
          <h3>{formatCurrency(summary?.byStatus?.approved)}</h3>
        </article>
        <article className="panel summary-card">
          <p>Pending</p>
          <h3>{formatCurrency(summary?.byStatus?.pending)}</h3>
        </article>
        <article className="panel summary-card">
          <p>Disputed</p>
          <h3>{formatCurrency(summary?.byStatus?.disputed)}</h3>
        </article>
      </section>

      <section className="workspace-grid">
        <div className="left-rail">
          <EntryForm onCreate={createEntry} isSubmitting={isSubmitting} />
          <ThemeCustomizer />
          <AutomationPanel
            automations={automations}
            onCreate={createAutomation}
            onToggleActive={toggleAutomation}
            onRunDue={runDueAutomations}
            isRunning={isRunningAutomations}
          />
        </div>

        <div className="right-rail">
          <RecommendationsPanel
            recommendations={recommendations}
            onQuickAdd={quickAddFromRecommendation}
            onSaveShortcut={saveRecommendationAsShortcut}
          />
          <ShortcutsPanel
            shortcuts={shortcuts}
            onCreate={createShortcut}
            onUse={useShortcut}
            onToggleFavorite={toggleShortcutFavorite}
            onDelete={deleteShortcut}
          />

          <section className="entries-wrap panel">
            <div className="panel-head">
              <h3>Entries ({entries.length})</h3>
              {isLoading ? <span className="badge">Refreshing...</span> : null}
            </div>
            {!isLoading && entries.length === 0 ? <p>No entries for this month yet.</p> : null}
            {entries.map((entry) => (
              <LedgerEntryCard
                key={entry._id}
                entry={entry}
                currentRole={user.role}
                onApprove={approveEntry}
                onDispute={disputeEntry}
                onQuickEdit={quickEditEntry}
                onCorrection={createCorrection}
              />
            ))}
          </section>
        </div>
      </section>
    </main>
  );
};

export default DashboardPage;
