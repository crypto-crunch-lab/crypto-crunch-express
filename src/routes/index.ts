import { Router } from "express";
import AssetRouter from "./AssetRouter"

const router = Router();

router.use('/api/v1/asset', AssetRouter);

export default router;