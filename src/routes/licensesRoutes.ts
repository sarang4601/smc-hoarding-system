import { Router } from 'express';
import { getAllLicenses, createLicense } from '../controllers/licensesController';

const router = Router();

router.get('/', getAllLicenses);
router.post('/', createLicense);

export default router;