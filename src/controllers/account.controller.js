const accountModel = require("../models/account.model")
const ledgerModel = require("../models/ledger.model")
const transactionModel = require("../models/transaction.model")

async function createAccountController(req, res){
    const user=req.user;
    const account=await accountModel.create({
        user:user._id
    })

    res.status(201).json({
        account
    })
}

async function getUserAccountsController(req, res){
    const accounts=await accountModel.find({user:req.user._id});
    res.status(200).json({
        accounts
    })
}

async function getAccountBalanceController(req, res){
    try{
        const {accountId}=req.params;
        
        const account = await accountModel.findOne({ 
            _id: accountId,
            user: req.user._id
        });
        

        if(!account){
            return res.status(404).json({
                message: "Account not found"
            })
        }

        const balance = await account.getBalance();

        res.status(200).json({
            balance,
            accountId: account._id
        })
    }catch(err){
        res.status(500).json({
            message: "Error fetching balance",
            error: err.message
        })
    }
}

async function getTransactionHistoryController(req, res){
    try{
        const userId = req.user._id;
        
        const account = await accountModel.findOne({ user: userId });
        
        if(!account){
            return res.status(404).json({
                message: "Account not found"
            })
        }

        const transactions = await transactionModel.find({
            $or: [
                { fromAccount: account._id },
                { toAccount: account._id }
            ]
        }).sort({ createdAt: -1 }).limit(20);

        const transactionsWithDetails = await Promise.all(
            transactions.map(async (tx) => ({
                _id: tx._id,
                type: tx.fromAccount.toString() === account._id.toString() ? "DEBIT" : "CREDIT",
                amount: tx.amount,
                fromAccount: tx.fromAccount,
                toAccount: tx.toAccount,
                status: tx.status,
                createdAt: tx.createdAt
            }))
        );

        res.status(200).json({
            transactions: transactionsWithDetails
        })
    }catch(err){
        res.status(500).json({
            message: "Error fetching transaction history",
            error: err.message
        })
    }
}

module.exports={
    createAccountController,
    getUserAccountsController,
    getAccountBalanceController,
    getTransactionHistoryController
}