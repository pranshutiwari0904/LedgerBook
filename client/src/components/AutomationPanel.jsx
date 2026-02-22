import { useState } from 'react';

const cadenceLabels = {
  daily: 'Daily',
  every_2_days: 'Every 2 days',
  weekly: 'Weekly',
  monthly: 'Monthly'
};

const formatDateTime = (date) => {
  if (!date) {
    return 'Never';
  }

  return new Date(date).toLocaleString('en-IN');
};

const AutomationPanel = ({ automations, onCreate, onToggleActive, onRunDue, isRunning }) => {
  const [form, setForm] = useState({
    name: '',
    itemName: '',
    quantity: '1',
    unit: 'packet',
    pricePerUnit: '',
    cadence: 'weekly',
    startDate: '',
    notes: ''
  });

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();

    const ok = await onCreate({
      name: form.name,
      itemName: form.itemName,
      quantity: Number(form.quantity),
      unit: form.unit,
      pricePerUnit: Number(form.pricePerUnit),
      cadence: form.cadence,
      startDate: form.startDate ? `${form.startDate}T00:00:00.000Z` : undefined,
      notes: form.notes
    });

    if (ok) {
      setForm((prev) => ({
        ...prev,
        name: '',
        itemName: '',
        pricePerUnit: '',
        notes: '',
        startDate: ''
      }));
    }
  };

  return (
    <section className="panel automation-panel">
      <div className="panel-head">
        <h3>Automation Center</h3>
        <button className="ghost" onClick={onRunDue} disabled={isRunning}>
          {isRunning ? 'Running...' : 'Run Due Now'}
        </button>
      </div>
      <p className="muted-text">Create recurring templates. Run due items anytime with one click.</p>

      <form className="compact-form" onSubmit={onSubmit}>
        <label>
          Automation Name
          <input
            required
            type="text"
            value={form.name}
            onChange={(e) => updateField('name', e.target.value)}
            placeholder="Weekly Bread"
          />
        </label>

        <label>
          Item Name
          <input
            required
            type="text"
            value={form.itemName}
            onChange={(e) => updateField('itemName', e.target.value)}
          />
        </label>

        <div className="form-row-two">
          <label>
            Quantity
            <input
              required
              type="number"
              min="0"
              step="0.01"
              value={form.quantity}
              onChange={(e) => updateField('quantity', e.target.value)}
            />
          </label>

          <label>
            Unit
            <input
              type="text"
              value={form.unit}
              onChange={(e) => updateField('unit', e.target.value)}
            />
          </label>
        </div>

        <label>
          Price Per Unit
          <input
            required
            type="number"
            min="0"
            step="0.01"
            value={form.pricePerUnit}
            onChange={(e) => updateField('pricePerUnit', e.target.value)}
          />
        </label>

        <div className="form-row-two">
          <label>
            Cadence
            <select value={form.cadence} onChange={(e) => updateField('cadence', e.target.value)}>
              {Object.entries(cadenceLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label>
            First Run Date
            <input type="date" value={form.startDate} onChange={(e) => updateField('startDate', e.target.value)} />
          </label>
        </div>

        <label>
          Notes
          <input
            type="text"
            value={form.notes}
            onChange={(e) => updateField('notes', e.target.value)}
            placeholder="Optional"
          />
        </label>

        <button type="submit">Create Automation</button>
      </form>

      <div className="automation-list">
        {automations.length === 0 ? <p className="muted-text">No automations configured.</p> : null}
        {automations.map((automation) => (
          <article key={automation._id} className="mini-card">
            <div className="mini-head">
              <h4>{automation.name}</h4>
              <span className="badge">{automation.active ? 'Active' : 'Paused'}</span>
            </div>
            <p>
              {automation.itemName}: {automation.quantity} {automation.unit} @ {automation.pricePerUnit}
            </p>
            <p>Cadence: {cadenceLabels[automation.cadence] || automation.cadence}</p>
            <p>Next run: {formatDateTime(automation.nextRunAt)}</p>
            <p>Last run: {formatDateTime(automation.lastRunAt)}</p>

            <div className="action-row">
              <button className="ghost" onClick={() => onToggleActive(automation)}>
                {automation.active ? 'Pause' : 'Activate'}
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default AutomationPanel;
