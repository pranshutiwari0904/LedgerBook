import asyncHandler from '../middleware/async.middleware.js';
import AutomationTemplate from '../models/AutomationTemplate.js';
import ItemShortcut from '../models/ItemShortcut.js';
import LedgerEntry from '../models/LedgerEntry.js';

const editableFields = ['itemName', 'quantity', 'unit', 'pricePerUnit', 'entryDate', 'notes'];
const automationCadences = ['daily', 'every_2_days', 'weekly', 'monthly'];

const round2 = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

const getRoleKey = (role) => {
  if (role === 'buyer' || role === 'seller') {
    return role;
  }

  throw new Error('Unknown role');
};

const normalizeText = (value, fallback = '') => (value === undefined || value === null ? fallback : value.toString().trim());

const isValidDate = (value) => {
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
};

const buildPendingApprovalsWithActorApproved = (actorRole, note = '') => {
  const base = {
    buyer: { status: 'pending', actedAt: null, note: '' },
    seller: { status: 'pending', actedAt: null, note: '' }
  };

  base[actorRole] = {
    status: 'approved',
    actedAt: new Date(),
    note
  };

  return base;
};

const computeStatus = (approvals) => {
  if (approvals.buyer.status === 'disputed' || approvals.seller.status === 'disputed') {
    return 'disputed';
  }

  if (approvals.buyer.status === 'approved' && approvals.seller.status === 'approved') {
    return 'approved';
  }

  return 'pending';
};

const getMonthRange = (month) => {
  if (!month) {
    return null;
  }

  const monthRegex = /^\d{4}-\d{2}$/;
  if (!monthRegex.test(month)) {
    return null;
  }

  const [yearStr, monthStr] = month.split('-');
  const year = Number(yearStr);
  const monthIndex = Number(monthStr) - 1;

  if (Number.isNaN(year) || Number.isNaN(monthIndex) || monthIndex < 0 || monthIndex > 11) {
    return null;
  }

  const start = new Date(Date.UTC(year, monthIndex, 1, 0, 0, 0));
  const end = new Date(Date.UTC(year, monthIndex + 1, 1, 0, 0, 0));

  return { start, end };
};

const parseAndValidateNumbers = (quantity, pricePerUnit) => {
  const q = Number(quantity);
  const p = Number(pricePerUnit);

  if (Number.isNaN(q) || Number.isNaN(p) || q < 0 || p < 0) {
    return null;
  }

  return { quantity: q, pricePerUnit: p, totalAmount: round2(q * p) };
};

const nextDateByCadence = (baseDate, cadence) => {
  const next = new Date(baseDate);

  if (cadence === 'daily') {
    next.setDate(next.getDate() + 1);
    return next;
  }

  if (cadence === 'every_2_days') {
    next.setDate(next.getDate() + 2);
    return next;
  }

  if (cadence === 'weekly') {
    next.setDate(next.getDate() + 7);
    return next;
  }

  if (cadence === 'monthly') {
    next.setMonth(next.getMonth() + 1);
    return next;
  }

  return null;
};

const createEntryRecord = async ({
  groupCode,
  itemName,
  quantity,
  unit,
  pricePerUnit,
  entryDate,
  notes,
  createdBy,
  actorRole,
  type = 'normal',
  linkedEntry = null,
  approvalNote = ''
}) => {
  const parsed = parseAndValidateNumbers(quantity, pricePerUnit);

  if (!parsed) {
    return null;
  }

  const normalizedItemName = normalizeText(itemName);
  if (!normalizedItemName) {
    return null;
  }

  const normalizedEntryDate = entryDate && isValidDate(entryDate) ? new Date(entryDate) : new Date();

  const entry = await LedgerEntry.create({
    groupCode,
    itemName: normalizedItemName,
    quantity: parsed.quantity,
    unit: normalizeText(unit, 'unit') || 'unit',
    pricePerUnit: parsed.pricePerUnit,
    totalAmount: parsed.totalAmount,
    entryDate: normalizedEntryDate,
    notes: normalizeText(notes, ''),
    type,
    linkedEntry,
    createdBy,
    approvals: buildPendingApprovalsWithActorApproved(actorRole, approvalNote),
    status: 'pending'
  });

  return entry;
};

export const createLedgerEntry = asyncHandler(async (req, res) => {
  const { itemName, quantity, unit, pricePerUnit, entryDate, notes } = req.body;

  if (!itemName || quantity === undefined || pricePerUnit === undefined) {
    return res.status(400).json({
      success: false,
      message: 'itemName, quantity, and pricePerUnit are required'
    });
  }

  const actorRole = getRoleKey(req.user.role);
  const entry = await createEntryRecord({
    groupCode: req.user.groupCode,
    itemName,
    quantity,
    unit,
    pricePerUnit,
    entryDate,
    notes,
    createdBy: req.user._id,
    actorRole
  });

  if (!entry) {
    return res.status(400).json({
      success: false,
      message: 'itemName, quantity, and pricePerUnit must be valid'
    });
  }

  return res.status(201).json({ success: true, entry });
});

export const listLedgerEntries = asyncHandler(async (req, res) => {
  const { month, status } = req.query;

  const query = {
    groupCode: req.user.groupCode
  };

  const monthRange = getMonthRange(month);
  if (month && !monthRange) {
    return res.status(400).json({ success: false, message: 'month format must be YYYY-MM' });
  }

  if (monthRange) {
    query.entryDate = {
      $gte: monthRange.start,
      $lt: monthRange.end
    };
  }

  if (status && ['pending', 'approved', 'disputed'].includes(status)) {
    query.status = status;
  }

  const entries = await LedgerEntry.find(query)
    .populate('createdBy', 'name role')
    .sort({ entryDate: -1, createdAt: -1 });

  return res.status(200).json({ success: true, entries });
});

export const editLedgerEntry = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason = '' } = req.body;

  const entry = await LedgerEntry.findOne({ _id: id, groupCode: req.user.groupCode });

  if (!entry) {
    return res.status(404).json({ success: false, message: 'Entry not found' });
  }

  if (entry.status === 'approved') {
    return res.status(400).json({
      success: false,
      message: 'Approved entries are locked. Create a correction entry instead.'
    });
  }

  const changes = [];

  for (const field of editableFields) {
    if (!(field in req.body)) {
      continue;
    }

    const oldValue = entry[field];
    let newValue = req.body[field];

    if (field === 'itemName' || field === 'unit' || field === 'notes') {
      newValue = normalizeText(newValue, '');
    }

    if (field === 'itemName' && !newValue) {
      return res.status(400).json({ success: false, message: 'itemName cannot be empty' });
    }

    if (field === 'quantity' || field === 'pricePerUnit') {
      newValue = Number(newValue);
      if (Number.isNaN(newValue) || newValue < 0) {
        return res.status(400).json({ success: false, message: `${field} must be a valid number >= 0` });
      }
    }

    if (field === 'entryDate') {
      newValue = new Date(newValue);
      if (Number.isNaN(newValue.getTime())) {
        return res.status(400).json({ success: false, message: 'entryDate must be a valid date' });
      }
    }

    const oldComparable = oldValue instanceof Date ? oldValue.toISOString() : oldValue;
    const newComparable = newValue instanceof Date ? newValue.toISOString() : newValue;

    if (oldComparable !== newComparable) {
      changes.push({ field, oldValue, newValue });
      entry[field] = newValue;
    }
  }

  if (changes.length === 0) {
    return res.status(400).json({ success: false, message: 'No valid changes provided' });
  }

  entry.totalAmount = round2(Number(entry.quantity) * Number(entry.pricePerUnit));

  const actorRole = getRoleKey(req.user.role);
  entry.version += 1;
  entry.approvals = buildPendingApprovalsWithActorApproved(actorRole);
  entry.status = 'pending';
  entry.history.push({
    version: entry.version,
    editedBy: req.user._id,
    reason,
    changes
  });

  await entry.save();

  return res.status(200).json({ success: true, entry });
});

export const decideLedgerEntry = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { decision, note = '' } = req.body;

  if (!['approve', 'dispute'].includes(decision)) {
    return res.status(400).json({ success: false, message: 'decision must be approve or dispute' });
  }

  const entry = await LedgerEntry.findOne({ _id: id, groupCode: req.user.groupCode });

  if (!entry) {
    return res.status(404).json({ success: false, message: 'Entry not found' });
  }

  if (entry.status === 'approved') {
    return res.status(400).json({
      success: false,
      message: 'Entry is already approved and locked. Use correction entry for changes.'
    });
  }

  const actorRole = getRoleKey(req.user.role);
  entry.approvals[actorRole] = {
    status: decision === 'approve' ? 'approved' : 'disputed',
    actedAt: new Date(),
    note
  };

  entry.status = computeStatus(entry.approvals);
  await entry.save();

  return res.status(200).json({ success: true, entry });
});

export const createCorrectionEntry = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { itemName, quantity, unit, pricePerUnit, entryDate, notes } = req.body;

  const original = await LedgerEntry.findOne({ _id: id, groupCode: req.user.groupCode });

  if (!original) {
    return res.status(404).json({ success: false, message: 'Original entry not found' });
  }

  if (original.status !== 'approved') {
    return res.status(400).json({
      success: false,
      message: 'You can create corrections only for approved entries'
    });
  }

  if (!itemName || quantity === undefined || pricePerUnit === undefined) {
    return res.status(400).json({
      success: false,
      message: 'itemName, quantity, and pricePerUnit are required'
    });
  }

  const actorRole = getRoleKey(req.user.role);

  const correctionEntry = await createEntryRecord({
    groupCode: req.user.groupCode,
    itemName,
    quantity,
    unit,
    pricePerUnit,
    entryDate,
    notes: normalizeText(notes, `Correction for entry ${original._id}`),
    createdBy: req.user._id,
    actorRole,
    type: 'correction',
    linkedEntry: original._id
  });

  if (!correctionEntry) {
    return res.status(400).json({ success: false, message: 'Invalid correction fields' });
  }

  return res.status(201).json({ success: true, entry: correctionEntry });
});

export const getLedgerSummary = asyncHandler(async (req, res) => {
  const { month } = req.query;

  const query = {
    groupCode: req.user.groupCode
  };

  const monthRange = getMonthRange(month);
  if (month && !monthRange) {
    return res.status(400).json({ success: false, message: 'month format must be YYYY-MM' });
  }

  if (monthRange) {
    query.entryDate = {
      $gte: monthRange.start,
      $lt: monthRange.end
    };
  }

  const entries = await LedgerEntry.find(query);

  const summary = entries.reduce(
    (acc, entry) => {
      acc.totalAmount = round2(acc.totalAmount + entry.totalAmount);
      acc.byStatus[entry.status] = round2(acc.byStatus[entry.status] + entry.totalAmount);
      acc.counts[entry.status] += 1;

      if (entry.type === 'correction') {
        acc.correctionAmount = round2(acc.correctionAmount + entry.totalAmount);
      }

      return acc;
    },
    {
      totalAmount: 0,
      correctionAmount: 0,
      byStatus: {
        pending: 0,
        approved: 0,
        disputed: 0
      },
      counts: {
        pending: 0,
        approved: 0,
        disputed: 0
      }
    }
  );

  return res.status(200).json({
    success: true,
    summary
  });
});

export const getRecommendations = asyncHandler(async (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 8, 1), 20);

  const historicalRecommendations = await LedgerEntry.aggregate([
    {
      $match: {
        groupCode: req.user.groupCode,
        status: 'approved'
      }
    },
    {
      $sort: {
        entryDate: -1
      }
    },
    {
      $group: {
        _id: {
          itemNameKey: { $toLower: '$itemName' },
          unit: '$unit'
        },
        itemName: { $first: '$itemName' },
        unit: { $first: '$unit' },
        times: { $sum: 1 },
        avgQuantity: { $avg: '$quantity' },
        avgPricePerUnit: { $avg: '$pricePerUnit' },
        lastPurchasedAt: { $first: '$entryDate' }
      }
    },
    {
      $sort: {
        times: -1,
        lastPurchasedAt: -1
      }
    },
    {
      $limit: limit
    }
  ]);

  const recommendations = historicalRecommendations.map((item) => ({
    source: 'history',
    itemName: item.itemName,
    unit: item.unit,
    suggestedQuantity: round2(item.avgQuantity),
    suggestedPricePerUnit: round2(item.avgPricePerUnit),
    confidence: Math.min(1, round2(item.times / 10)),
    frequency: item.times,
    lastPurchasedAt: item.lastPurchasedAt
  }));

  if (recommendations.length < limit) {
    const existingKeys = new Set(recommendations.map((item) => `${item.itemName.toLowerCase()}|${item.unit}`));

    const shortcuts = await ItemShortcut.find({ groupCode: req.user.groupCode })
      .sort({ isFavorite: -1, timesUsed: -1, updatedAt: -1 })
      .limit(limit * 2);

    for (const shortcut of shortcuts) {
      if (recommendations.length >= limit) {
        break;
      }

      const key = `${shortcut.itemName.toLowerCase()}|${shortcut.unit}`;
      if (existingKeys.has(key)) {
        continue;
      }

      existingKeys.add(key);
      recommendations.push({
        source: 'shortcut',
        itemName: shortcut.itemName,
        unit: shortcut.unit,
        suggestedQuantity: shortcut.quantity,
        suggestedPricePerUnit: shortcut.pricePerUnit,
        confidence: 0.5,
        frequency: shortcut.timesUsed,
        lastPurchasedAt: shortcut.lastUsedAt
      });
    }
  }

  return res.status(200).json({
    success: true,
    recommendations
  });
});

export const listShortcuts = asyncHandler(async (req, res) => {
  const shortcuts = await ItemShortcut.find({ groupCode: req.user.groupCode })
    .populate('createdBy', 'name role')
    .sort({ isFavorite: -1, timesUsed: -1, updatedAt: -1 });

  return res.status(200).json({ success: true, shortcuts });
});

export const createShortcut = asyncHandler(async (req, res) => {
  const { name, itemName, quantity, unit, pricePerUnit, notes, isFavorite } = req.body;

  if (!name || !itemName || quantity === undefined || pricePerUnit === undefined) {
    return res.status(400).json({
      success: false,
      message: 'name, itemName, quantity, and pricePerUnit are required'
    });
  }

  const parsed = parseAndValidateNumbers(quantity, pricePerUnit);
  if (!parsed) {
    return res.status(400).json({ success: false, message: 'quantity and pricePerUnit must be valid numbers >= 0' });
  }

  const shortcut = await ItemShortcut.create({
    groupCode: req.user.groupCode,
    name: normalizeText(name),
    itemName: normalizeText(itemName),
    quantity: parsed.quantity,
    unit: normalizeText(unit, 'unit') || 'unit',
    pricePerUnit: parsed.pricePerUnit,
    notes: normalizeText(notes, ''),
    isFavorite: Boolean(isFavorite),
    createdBy: req.user._id
  });

  return res.status(201).json({ success: true, shortcut });
});

export const updateShortcut = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const shortcut = await ItemShortcut.findOne({ _id: id, groupCode: req.user.groupCode });
  if (!shortcut) {
    return res.status(404).json({ success: false, message: 'Shortcut not found' });
  }

  const allowedFields = ['name', 'itemName', 'quantity', 'unit', 'pricePerUnit', 'notes', 'isFavorite'];

  for (const field of allowedFields) {
    if (!(field in req.body)) {
      continue;
    }

    if (field === 'name' || field === 'itemName' || field === 'unit' || field === 'notes') {
      shortcut[field] = normalizeText(req.body[field], field === 'unit' ? 'unit' : '');
      continue;
    }

    if (field === 'quantity' || field === 'pricePerUnit') {
      const value = Number(req.body[field]);
      if (Number.isNaN(value) || value < 0) {
        return res.status(400).json({ success: false, message: `${field} must be a valid number >= 0` });
      }
      shortcut[field] = value;
      continue;
    }

    if (field === 'isFavorite') {
      shortcut[field] = Boolean(req.body[field]);
    }
  }

  if (!shortcut.name || !shortcut.itemName) {
    return res.status(400).json({ success: false, message: 'name and itemName cannot be empty' });
  }

  await shortcut.save();

  return res.status(200).json({ success: true, shortcut });
});

export const deleteShortcut = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const shortcut = await ItemShortcut.findOneAndDelete({ _id: id, groupCode: req.user.groupCode });

  if (!shortcut) {
    return res.status(404).json({ success: false, message: 'Shortcut not found' });
  }

  return res.status(200).json({ success: true, message: 'Shortcut deleted' });
});

export const useShortcut = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const shortcut = await ItemShortcut.findOne({ _id: id, groupCode: req.user.groupCode });

  if (!shortcut) {
    return res.status(404).json({ success: false, message: 'Shortcut not found' });
  }

  const actorRole = getRoleKey(req.user.role);

  const entry = await createEntryRecord({
    groupCode: req.user.groupCode,
    itemName: req.body.itemName ?? shortcut.itemName,
    quantity: req.body.quantity ?? shortcut.quantity,
    unit: req.body.unit ?? shortcut.unit,
    pricePerUnit: req.body.pricePerUnit ?? shortcut.pricePerUnit,
    entryDate: req.body.entryDate,
    notes: req.body.notes ?? shortcut.notes,
    createdBy: req.user._id,
    actorRole,
    approvalNote: `Created from shortcut: ${shortcut.name}`
  });

  if (!entry) {
    return res.status(400).json({ success: false, message: 'Invalid values provided while using shortcut' });
  }

  shortcut.timesUsed += 1;
  shortcut.lastUsedAt = new Date();
  await shortcut.save();

  return res.status(201).json({ success: true, entry, shortcut });
});

export const listAutomations = asyncHandler(async (req, res) => {
  const automations = await AutomationTemplate.find({ groupCode: req.user.groupCode })
    .populate('createdBy', 'name role')
    .sort({ active: -1, nextRunAt: 1 });

  return res.status(200).json({ success: true, automations });
});

export const createAutomation = asyncHandler(async (req, res) => {
  const { name, itemName, quantity, unit, pricePerUnit, notes, cadence, startDate } = req.body;

  if (!name || !itemName || quantity === undefined || pricePerUnit === undefined || !cadence) {
    return res.status(400).json({
      success: false,
      message: 'name, itemName, quantity, pricePerUnit, and cadence are required'
    });
  }

  if (!automationCadences.includes(cadence)) {
    return res.status(400).json({ success: false, message: `cadence must be one of: ${automationCadences.join(', ')}` });
  }

  const parsed = parseAndValidateNumbers(quantity, pricePerUnit);
  if (!parsed) {
    return res.status(400).json({ success: false, message: 'quantity and pricePerUnit must be valid numbers >= 0' });
  }

  const nextRunAt = startDate ? new Date(startDate) : new Date();
  if (Number.isNaN(nextRunAt.getTime())) {
    return res.status(400).json({ success: false, message: 'startDate must be a valid date' });
  }

  const automation = await AutomationTemplate.create({
    groupCode: req.user.groupCode,
    name: normalizeText(name),
    itemName: normalizeText(itemName),
    quantity: parsed.quantity,
    unit: normalizeText(unit, 'unit') || 'unit',
    pricePerUnit: parsed.pricePerUnit,
    notes: normalizeText(notes, ''),
    cadence,
    nextRunAt,
    createdBy: req.user._id
  });

  return res.status(201).json({ success: true, automation });
});

export const updateAutomation = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const automation = await AutomationTemplate.findOne({ _id: id, groupCode: req.user.groupCode });
  if (!automation) {
    return res.status(404).json({ success: false, message: 'Automation not found' });
  }

  const allowedFields = ['name', 'itemName', 'quantity', 'unit', 'pricePerUnit', 'notes', 'cadence', 'nextRunAt', 'active'];

  for (const field of allowedFields) {
    if (!(field in req.body)) {
      continue;
    }

    if (field === 'name' || field === 'itemName' || field === 'unit' || field === 'notes') {
      automation[field] = normalizeText(req.body[field], field === 'unit' ? 'unit' : '');
      continue;
    }

    if (field === 'quantity' || field === 'pricePerUnit') {
      const value = Number(req.body[field]);
      if (Number.isNaN(value) || value < 0) {
        return res.status(400).json({ success: false, message: `${field} must be a valid number >= 0` });
      }

      automation[field] = value;
      continue;
    }

    if (field === 'cadence') {
      if (!automationCadences.includes(req.body[field])) {
        return res.status(400).json({ success: false, message: `cadence must be one of: ${automationCadences.join(', ')}` });
      }
      automation.cadence = req.body[field];
      continue;
    }

    if (field === 'nextRunAt') {
      const nextRunAt = new Date(req.body[field]);
      if (Number.isNaN(nextRunAt.getTime())) {
        return res.status(400).json({ success: false, message: 'nextRunAt must be a valid date' });
      }
      automation.nextRunAt = nextRunAt;
      continue;
    }

    if (field === 'active') {
      automation.active = Boolean(req.body[field]);
    }
  }

  if (!automation.name || !automation.itemName) {
    return res.status(400).json({ success: false, message: 'name and itemName cannot be empty' });
  }

  await automation.save();

  return res.status(200).json({ success: true, automation });
});

export const runAutomations = asyncHandler(async (req, res) => {
  const now = new Date();

  const dueAutomations = await AutomationTemplate.find({
    groupCode: req.user.groupCode,
    active: true,
    nextRunAt: { $lte: now }
  })
    .sort({ nextRunAt: 1 })
    .limit(25);

  if (dueAutomations.length === 0) {
    return res.status(200).json({
      success: true,
      createdCount: 0,
      entries: []
    });
  }

  const actorRole = getRoleKey(req.user.role);
  const entries = [];

  for (const automation of dueAutomations) {
    const entry = await createEntryRecord({
      groupCode: req.user.groupCode,
      itemName: automation.itemName,
      quantity: automation.quantity,
      unit: automation.unit,
      pricePerUnit: automation.pricePerUnit,
      entryDate: now,
      notes: `${automation.notes} [Auto: ${automation.name}]`.trim(),
      createdBy: req.user._id,
      actorRole,
      approvalNote: `Created by automation: ${automation.name}`
    });

    if (entry) {
      entries.push(entry);
    }

    automation.lastRunAt = now;
    automation.timesTriggered += 1;
    const nextRunAt = nextDateByCadence(automation.nextRunAt, automation.cadence);

    if (!nextRunAt) {
      automation.active = false;
    } else {
      automation.nextRunAt = nextRunAt;
    }

    await automation.save();
  }

  return res.status(200).json({
    success: true,
    createdCount: entries.length,
    entries
  });
});
