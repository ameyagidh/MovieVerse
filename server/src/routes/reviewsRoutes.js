import { Router } from 'express';
import { upsertReview, deleteReview, myReviewForMovie } from '../controllers/reviewsController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth());
router.post('/', upsertReview);
router.delete('/:id', deleteReview);
router.get('/mine/:movieId', myReviewForMovie);

export default router;
