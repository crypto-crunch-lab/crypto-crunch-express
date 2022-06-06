import { Router } from "express";
import { AssetController } from "../controllers";

const router: Router = Router();

router.get('/:id', AssetController.getBalance);
router.get('/list', AssetController.getAssetList);

export default router;