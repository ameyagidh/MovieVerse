import { Router } from 'express';
import { myWatchlist, addToWatchlist, removeFromWatchlist } from '../controllers/watchlistController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth());
router.get('/', myWatchlist);
router.post('/', addToWatchlist);
router.delete('/:movieId', removeFromWatchlist);

export default router;
