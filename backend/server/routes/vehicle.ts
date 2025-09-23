import express from 'express';
import { VehicleController } from '../controllers/VehicleController';
import { auth } from '../middleware/auth';

const router = express.Router();

// GET /api/vehicles
router.get('/', auth, VehicleController.getAllVehicles);

// POST /api/vehicles
router.post('/', auth, VehicleController.createVehicle);

// GET /api/vehicles/:id
router.get('/:id', auth, VehicleController.getVehicleById);

// PUT /api/vehicles/:id
router.put('/:id', auth, VehicleController.updateVehicle);

// DELETE /api/vehicles/:id
router.delete('/:id', auth, VehicleController.deleteVehicle);

// GET /api/vehicles/available
router.get('/available/all', auth, VehicleController.getAvailableVehicles);

// GET /api/vehicles/delivery/all
router.get('/delivery/all', auth, VehicleController.getAllVehiclesForDelivery);

// GET /api/vehicles/speed-range
router.get('/speed-range/search', auth, VehicleController.getVehiclesBySpeedRange);

// GET /api/vehicles/weight-range
router.get('/weight-range/search', auth, VehicleController.getVehiclesByWeightCapacity);

// PUT /api/vehicles/:id/availability
router.put('/:id/availability', auth, VehicleController.updateVehicleAvailability);

export default router;