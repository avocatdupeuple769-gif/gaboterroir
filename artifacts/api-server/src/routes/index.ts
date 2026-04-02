import { Router, type IRouter } from "express";
import healthRouter from "./health";
import productsRouter from "./products";
import ordersRouter from "./orders";
import usersRouter from "./users";
import paymentsRouter from "./payments";
import smsRouter from "./sms";
import ussdRouter from "./ussd";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/api/v1", productsRouter);
router.use("/api/v1", ordersRouter);
router.use("/api/v1", usersRouter);
router.use("/api/v1", paymentsRouter);
router.use("/api/v1", smsRouter);
router.use("/api/v1", ussdRouter);

export default router;
