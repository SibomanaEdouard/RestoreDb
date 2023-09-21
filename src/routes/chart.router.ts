import { Router } from "express";
import ChartController from "../controllers/chart.controller";
// import auth from "../middleware/auth";
import authMiddleware from "../middleware/auth.middleware";
const router = Router();

router.get("/netflownts", ChartController.netflownts);
router.get("/netflowmat", ChartController.netflowmat);

export default router;
