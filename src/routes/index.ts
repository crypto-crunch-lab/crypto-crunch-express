import { Router } from "express";
import PortfolioRouter from "./PortfolioRouter"

const router = Router();

router.use('/portfolio', PortfolioRouter);

export default router;