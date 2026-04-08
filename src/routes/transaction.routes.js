const {Router} =require('express');
const authMiddleware= require('../middleware/auth.middleware');
const transactionController=require("../controllers/transaction.controller")

const transactionRoutes=Router();

transactionRoutes.post("/", authMiddleware.authMiddleware , transactionController.createTransaction)

transactionRoutes.post("/send", authMiddleware.authMiddleware, transactionController.createUserTransaction)

transactionRoutes.post("/system/initial-funds", authMiddleware.authSystemMiddleware, transactionController.createInitialFundsTransaction )


module.exports=transactionRoutes;