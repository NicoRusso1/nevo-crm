import { Router } from 'express';
import healthRoutes from './health.routes';

/**
 * API root router. Mount additional feature routers here as they are added:
 *   router.use('/auth',     authRoutes);
 *   router.use('/users',    userRoutes);
 *   router.use('/contacts', contactRoutes);
 *   router.use('/deals',    dealRoutes);
 */
const router = Router();

router.use('/health', healthRoutes);

export default router;
