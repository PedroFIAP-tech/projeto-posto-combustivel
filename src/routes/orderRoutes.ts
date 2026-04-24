import { Router } from 'express';
import {
  handleGetOrderHistory,
  handleGetPendingOrders,
  handlePayOrder,
} from '../controllers/orderController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

router.use(authMiddleware);
router.get('/pendentes', handleGetPendingOrders);
router.get('/historico', handleGetOrderHistory);
router.patch('/:id/pagar', handlePayOrder);

export default router;
