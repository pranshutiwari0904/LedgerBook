import express from 'express';
import {
  createAutomation,
  createCorrectionEntry,
  createLedgerEntry,
  createShortcut,
  decideLedgerEntry,
  deleteShortcut,
  editLedgerEntry,
  getRecommendations,
  getLedgerSummary,
  listAutomations,
  listLedgerEntries,
  listShortcuts,
  runAutomations,
  updateAutomation,
  updateShortcut,
  useShortcut
} from '../controllers/ledger.controller.js';
import { protect, authorizeRoles } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);
router.use(authorizeRoles('buyer', 'seller'));

router.get('/', listLedgerEntries);
router.get('/summary', getLedgerSummary);
router.get('/recommendations', getRecommendations);
router.get('/shortcuts', listShortcuts);
router.post('/shortcuts', createShortcut);
router.patch('/shortcuts/:id', updateShortcut);
router.delete('/shortcuts/:id', deleteShortcut);
router.post('/shortcuts/:id/use', useShortcut);
router.get('/automations', listAutomations);
router.post('/automations', createAutomation);
router.patch('/automations/:id', updateAutomation);
router.post('/automations/run-due', runAutomations);
router.post('/', createLedgerEntry);
router.patch('/:id', editLedgerEntry);
router.patch('/:id/decision', decideLedgerEntry);
router.post('/:id/corrections', createCorrectionEntry);

export default router;
