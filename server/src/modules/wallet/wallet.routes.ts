import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import * as walletCtrl from './wallet.controller';

const router = Router();

// All wallet routes require authentication
router.use(authenticate);

router.get('/', walletCtrl.getWallet);
router.get('/transactions', walletCtrl.getTransactions);
router.get('/escrows', walletCtrl.getEscrows);
router.post('/add-money', walletCtrl.addMoney);
router.post('/hold', walletCtrl.holdFunds);
router.post('/release', authorize(['ADMIN', 'MANAGER']), walletCtrl.releaseFunds);
router.post('/refund', authorize(['ADMIN', 'MANAGER', 'SUPPORT']), walletCtrl.refundFunds);

export default router;
