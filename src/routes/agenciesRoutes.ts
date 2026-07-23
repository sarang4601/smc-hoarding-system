import { Router } from 'express';
import { 
    getAllAgencies, 
    getAgencyById, 
    createAgency, 
    updateAgency, 
    deleteAgency 
} from '../controllers/agenciesController';

const router = Router();

router.get('/', getAllAgencies);
router.get('/:id', getAgencyById);
router.post('/', createAgency);
router.put('/:id', updateAgency);
router.delete('/:id', deleteAgency);

export default router;