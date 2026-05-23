import { Router } from 'express';
import healthRoutes from './health.routes';
import authRoutes from './auth.routes';
import usersRoutes from './users.routes';
import leadsRoutes from './leads.routes';

/**
 * API root router. Mount additional feature routers here as they are added:
 *   router.use('/clients',  clientRoutes);
 *   router.use('/deals',    dealRoutes);
 */
const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/leads', leadsRoutes);

export default router;
