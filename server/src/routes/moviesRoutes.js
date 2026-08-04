import { Router } from 'express';
import { search, genres, home, getMovie } from '../controllers/moviesController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth());
router.get('/', search);
router.get('/home', home);
router.get('/genres', genres);
router.get('/:id', getMovie);

export default router;
