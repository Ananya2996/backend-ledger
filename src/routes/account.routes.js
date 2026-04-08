const express=require('express')
const authMiddleware=require("../middleware/auth.middleware")
const accountController=require("../controllers/account.controller")

const router=express.Router()

//-POST/api/accounts/
//create a new account

router.post("/",authMiddleware.authMiddleware,accountController.createAccountController)

//GET/api/accounts
router.get("/",authMiddleware.authMiddleware, accountController.getUserAccountsController)

//GET /api/accounts/balance/:accountId
//get user balance
router.get("/balance/:accountId", authMiddleware.authMiddleware, accountController.getAccountBalanceController)

//GET /api/accounts/history
//get transaction history
router.get("/history", authMiddleware.authMiddleware, accountController.getTransactionHistoryController)



module.exports=router