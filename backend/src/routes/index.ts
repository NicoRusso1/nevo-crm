import { Router } from 'express';
import healthRoutes from './health.routes';
import authRoutes from './auth.routes';
import usersRoutes from './users.routes';
import leadsRoutes from './leads.routes';
import clientsRoutes from './clients.routes';

/**
 * API root router. Mount additional feature routers here as they are added:
 *   router.use('/deals',         dealRoutes);
 *   router.use('/activities',    activitiesRoutes);
 *   router.use('/notifications', notificationsRoutes);
 */
const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/leads', leadsRoutes);
router.use('/clients', clientsRoutes);

export default router;
