import { useState } from 'react';

const ShortcutsPanel = ({ shortcuts, onCreate, onUse, onToggleFavorite, onDelete }) => {
  const [form, setForm] = useState({
    name: '',
    itemName: '',
    quantity: '1',
    unit: 'packet',
    pricePerUnit: '',
    notes: '',
    isFavorite: false
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
      notes: form.notes,
      isFavorite: form.isFavorite
    });

    if (ok) {
      setForm({
        name: '',
        itemName: '',
        quantity: '1',
        unit: 'packet',
        pricePerUnit: '',
        notes: '',
        isFavorite: false
      });
    }
  };

  return (
    <section className="panel shortcuts-panel">
      <h3>Shortcuts</h3>
      <p className="muted-text">Create reusable presets for items you buy regularly.</p>

      <form className="compact-form" onSubmit={onSubmit}>
        <label>
          Shortcut Name
          <input
            required
            type="text"
            value={form.name}
            onChange={(e) => updateField('name', e.target.value)}
            placeholder="Daily Milk"
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

        <label>
          Notes
          <input
            type="text"
            value={form.notes}
            onChange={(e) => updateField('notes', e.target.value)}
            placeholder="Optional"
          />
        </label>

        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={form.isFavorite}
            onChange={(e) => updateField('isFavorite', e.target.checked)}
          />
          Mark as favorite
        </label>

        <button type="submit">Save Shortcut</button>
      </form>

      <div className="shortcut-list">
        {shortcuts.length === 0 ? <p className="muted-text">No shortcuts yet.</p> : null}
        {shortcuts.map((shortcut) => (
          <article key={shortcut._id} className="mini-card">
            <div className="mini-head">
              <h4>{shortcut.name}</h4>
              {shortcut.isFavorite ? <span className="badge">Favorite</span> : null}
            </div>
            <p>
              {shortcut.itemName}: {shortcut.quantity} {shortcut.unit} @ {shortcut.pricePerUnit}
            </p>
            <p>Used: {shortcut.timesUsed || 0} times</p>
            {shortcut.notes ? <p>Notes: {shortcut.notes}</p> : null}

            <div className="action-row">
              <button onClick={() => onUse(shortcut._id)}>Use Now</button>
              <button className="ghost" onClick={() => onToggleFavorite(shortcut)}>
                {shortcut.isFavorite ? 'Unfavorite' : 'Favorite'}
              </button>
              <button className="warn" onClick={() => onDelete(shortcut._id)}>
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default ShortcutsPanel;
