import { Router, type IRouter } from "express";
import healthRouter from "./health";
import restaurantsRouter from "./restaurants";
import dishesRouter from "./dishes";
import shortlistRouter from "./shortlist";
import adminRouter from "./admin";
import openaiRouter from "./openai";

const router: IRouter = Router();

router.use(healthRouter);
router.use(restaurantsRouter);
router.use(dishesRouter);
router.use(shortlistRouter);
router.use(adminRouter);
router.use(openaiRouter);

export default router;
