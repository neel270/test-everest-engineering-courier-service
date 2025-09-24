import express from "express";
import { DeliveryController } from "../controllers/DeliveryController";
import { auth } from "../middleware/auth";

const router = express.Router();

// POST /api/delivery/calculate
router.post("/calculate", auth, DeliveryController.calculateDeliveryCosts);

// GET /api/delivery/history
router.get("/history", auth, DeliveryController.getDeliveryHistory);

// GET /api/delivery/stats
router.get("/stats/all", auth, DeliveryController.getDeliveryStats);

// GET /api/delivery/date-range
router.get(
  "/date-range/search",
  auth,
  DeliveryController.getDeliveriesByDateRange
);

// GET /api/delivery/cost-range
router.get(
  "/cost-range/search",
  auth,
  DeliveryController.getDeliveriesByCostRange
);

// GET /api/delivery/vehicle/:vehicleId
router.get(
  "/vehicle/:vehicleId",
  auth,
  DeliveryController.getDeliveriesByVehicle
);

// GET /api/delivery/filter
router.get("/filter", auth, DeliveryController.getDeliveriesWithFilters);
// GET /api/delivery/:id
router.get("/:id", auth, DeliveryController.getDeliveryById);
// DELETE /api/delivery/:id
router.delete("/:id", auth, DeliveryController.deleteDelivery);

export default router;
