import { Request, response, Response } from "express";
import statusCode from "../modules/statusCode";
import message from "../modules/responseMessage";
import util from "../modules/util";
import { AssetService } from "../services";

const getBalance = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const data = await AssetService.getBalance(parseInt(id));
        if (!data) {
            return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, message.INVALID_API_KEY))
        }
        res.status(statusCode.CREATED).send(util.success(statusCode.CREATED, message.GET_ASSET_SUCCESS, data));
    } catch (error) {
        console.log(error);
        res.status(statusCode.INTERNAL_SERVER_ERROR).send(util.fail(statusCode.INTERNAL_SERVER_ERROR, message.INTERNAL_SERVER_ERROR))
    }
}

const getAssetList = async (req: Request, res: Response) => {
    try {
        const { accesstoken } = req.headers;
        const data = await AssetService.getAllApiKey(accesstoken);
        res.status(statusCode.CREATED).send(util.success(statusCode.CREATED, message.GET_ASSET_SUCCESS, data));
    } catch (error) {
        console.log(error);
        res.status(statusCode.INTERNAL_SERVER_ERROR).send(util.fail(statusCode.INTERNAL_SERVER_ERROR, message.INTERNAL_SERVER_ERROR))
    }
}

export default {
    getBalance,
    getAssetList
}