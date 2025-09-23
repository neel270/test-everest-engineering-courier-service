
import express from 'express';
import { PackageController } from '../controllers/PackageController';
import { auth } from '../middleware/auth';

const router = express.Router();

// GET /api/packages
router.get('/', auth, PackageController.getAllPackages);

// POST /api/packages
router.post('/', auth, PackageController.createPackage);

// GET /api/packages/:id
router.get('/:id', auth, PackageController.getPackageById);

// PUT /api/packages/:id
router.put('/:id', auth, PackageController.updatePackage);

// DELETE /api/packages/:id
router.delete('/:id', auth, PackageController.deletePackage);

// GET /api/packages/offer/:offerCode
router.get('/offer/:offerCode', auth, PackageController.getPackagesByOfferCode);

// GET /api/packages/weight-range
router.get('/weight-range/search', auth, PackageController.getPackagesByWeightRange);

export default router;