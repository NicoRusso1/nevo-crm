import { Router } from 'express';
import healthRoutes from './health.routes';
import authRoutes from './auth.routes';
import usersRoutes from './users.routes';
import leadsRoutes from './leads.routes';
import clientsRoutes from './clients.routes';
import dealsRoutes from './deals.routes';
import activitiesRoutes from './activities.routes';
import dashboardRoutes from './dashboard.routes';

/**
 * API root router. Mount additional feature routers here as they are added:
 *   router.use('/notifications', notificationsRoutes);
 */
const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/leads', leadsRoutes);
router.use('/clients', clientsRoutes);
router.use('/deals', dealsRoutes);
router.use('/activities', activitiesRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;
