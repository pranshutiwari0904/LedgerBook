import { useState } from 'react';

const todayString = new Date().toISOString().slice(0, 10);

const EntryForm = ({ onCreate, isSubmitting }) => {
  const [form, setForm] = useState({
    itemName: '',
    quantity: '1',
    unit: 'packet',
    pricePerUnit: '',
    entryDate: todayString,
    notes: ''
  });

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();

    const isCreated = await onCreate({
      itemName: form.itemName,
      quantity: Number(form.quantity),
      unit: form.unit,
      pricePerUnit: Number(form.pricePerUnit),
      entryDate: form.entryDate,
      notes: form.notes
    });

    if (isCreated) {
      setForm((prev) => ({
        ...prev,
        itemName: '',
        pricePerUnit: '',
        notes: ''
      }));
    }
  };

  return (
    <form className="panel entry-form" onSubmit={onSubmit}>
      <h3>Add Grocery Entry</h3>
      <label>
        Item Name
        <input
          type="text"
          required
          value={form.itemName}
          onChange={(e) => updateField('itemName', e.target.value)}
          placeholder="Milk"
        />
      </label>
      <label>
        Quantity
        <input
          type="number"
          step="0.01"
          min="0"
          required
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
          placeholder="litre, packet, kg"
        />
      </label>
      <label>
        Price Per Unit
        <input
          type="number"
          step="0.01"
          min="0"
          required
          value={form.pricePerUnit}
          onChange={(e) => updateField('pricePerUnit', e.target.value)}
        />
      </label>
      <label>
        Date
        <input
          type="date"
          required
          value={form.entryDate}
          onChange={(e) => updateField('entryDate', e.target.value)}
        />
      </label>
      <label>
        Notes
        <input
          type="text"
          value={form.notes}
          onChange={(e) => updateField('notes', e.target.value)}
          placeholder="Optional details"
        />
      </label>
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : 'Add Entry'}
      </button>
    </form>
  );
};

export default EntryForm;
