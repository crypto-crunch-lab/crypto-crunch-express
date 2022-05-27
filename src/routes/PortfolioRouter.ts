import { Router } from "express";
import { PortfolioController } from "../controllers";

const router: Router = Router();

router.get('/:id', PortfolioController.getBalance);
router.get('/list', PortfolioController.getPortfolioList);

export default router;