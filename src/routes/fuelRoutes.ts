import { Router } from 'express';
import { ROLES } from '../constants/roles';
import { handleListFuels, handleUpdateFuelPrice } from '../controllers/fuelController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { authorize } from '../middlewares/roleMiddleware';

const router = Router();

router.use(authMiddleware);
router.get('/', handleListFuels);
router.put('/:id', authorize([ROLES.ADMIN]), handleUpdateFuelPrice);

export default router;
