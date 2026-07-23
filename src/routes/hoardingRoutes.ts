import { Router } from 'express';
import {
    getAllHoardings,
    getHoardingById,
    createHoarding,
    updateHoarding,
    deleteHoarding
} from '../controllers/hoardingController';

const router = Router();

router.get('/', getAllHoardings);
router.get('/:id', getHoardingById);
router.post('/', createHoarding);
router.put('/:id', updateHoarding);
router.delete('/:id', deleteHoarding);

export default router;