import express from "express";

import dataRouter from "./data.js";
import sessionRouter from "./session.js";
import authRouter from "./auth.js";

const router = express.Router();

router.use("/data", dataRouter);
router.use("/sessions", sessionRouter);
router.use("/auth", authRouter);

export default router;