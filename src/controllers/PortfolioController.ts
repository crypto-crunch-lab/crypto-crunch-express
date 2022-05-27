import { Request, response, Response } from "express";
import statusCode from "../modules/statusCode";
import message from "../modules/responseMessage";
import util from "../modules/util";
import { PortfolioService } from "../services";

const getBalance = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        console.log(id)
        const { accesstoken } = req.headers;
        const data = await PortfolioService.getBalance(accesstoken, parseInt(id));
        res.status(statusCode.CREATED).send(util.success(statusCode.CREATED, message.CREATE_USER_SUCCESS, data));
    } catch (error) {
        console.log(error);
        res.status(statusCode.INTERNAL_SERVER_ERROR).send(util.fail(statusCode.INTERNAL_SERVER_ERROR, message.INTERNAL_SERVER_ERROR))
    }
}

const getPortfolioList = async (req: Request, res: Response) => {
    try {
        const { accesstoken } = req.headers;
        const data = await PortfolioService.getAllApiKey(accesstoken);
        res.status(statusCode.CREATED).send(util.success(statusCode.CREATED, message.CREATE_USER_SUCCESS, data));
    } catch (error) {
        console.log(error);
        res.status(statusCode.INTERNAL_SERVER_ERROR).send(util.fail(statusCode.INTERNAL_SERVER_ERROR, message.INTERNAL_SERVER_ERROR))
    }
}

export default {
    getBalance,
    getPortfolioList
}