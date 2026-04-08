const transactionModel = require("../models/transaction.model");
const ledgerModel = require("../models/ledger.model");
const accountModel = require("../models/account.model");
const emailService = require("../services/email.service");
const userModel = require("../models/user.model");
const mongoose = require("mongoose");


// createTransaction

async function createTransaction(req, res) {
    try {

        //validate request
        const { fromAccount, toAccount, amount, idempotencyKey } = req.body;

        console.log('createTransaction called with', {
            fromAccount,
            toAccount,
            amount,
            idempotencyKey,
            user: req.user && req.user._id
        });

        if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
            return res.status(400).json({
                message: "FromAccount, toAccount, amount and idempotencyKey"
            });
        }

        const fromUserAccount = await accountModel.findOne({ _id: fromAccount });
        const toUserAccount = await accountModel.findOne({ _id: toAccount });

        console.log('found accounts:', {
            fromUserAccount: !!fromUserAccount,
            toUserAccount: !!toUserAccount
        });

        if (!fromUserAccount || !toUserAccount) {
            return res.status(400).json({
                message: "Invalid fromAccount or toAccount"
            });
        }

        //validate idempotencyKey
        const isTransactionAllreadyExixts = await transactionModel.findOne({
            idempotencyKey: idempotencyKey
        });

        if (isTransactionAllreadyExixts) {

            if (isTransactionAllreadyExixts.status === "COMPLETED") {
                return res.status(200).json({
                    message: "transaction already processed",
                });
            }

            if (isTransactionAllreadyExixts.status === "PENDING") {
                return res.status(200).json({
                    message: "transaction is still in processing",
                });
            }

            if (isTransactionAllreadyExixts.status === "FAILED") {
                return res.status(500).json({
                    message: "transaction processing failed",
                });
            }

            if (isTransactionAllreadyExixts.status === "REVERSED") {
                return res.status(500).json({
                    message: "transaction is reversed, please try again later",
                });
            }
        }

        //check account status
        if (fromUserAccount.status !== "ACTIVE" || toUserAccount.status !== "ACTIVE") {
            return res.status(400).json({
                message: "Both fromAccount and toAccount must be ACTIVE to process transaction"
            });
        }

        //Derive sender balance from ledger
        const balance = await fromUserAccount.getBalance();

        if (balance < amount) {
            return res.status(400).json({
                message: `Insufficient balance. Current balance is ${balance}. Requested amount is ${amount}`
            });
        }

        //create transaction (pending)
        const session = await mongoose.startSession();

        try {
            session.startTransaction();

            const [transaction] = await transactionModel.create([{
                fromAccount,
                toAccount,
                amount,
                idempotencyKey,
                status: "PENDING"
            }], { session });

            const debitLedgerEntry = await ledgerModel.create([{
                account: fromAccount,
                amount: amount,
                transaction: transaction._id,
                type: "DEBIT"
            }], { session });

            //   await (()=>{
            //     return new Promise((resolve) =>setTimeout(resolve, 100 * 1000));
            //   })()

            const creditLedgerEntry = await ledgerModel.create([{
                account: toAccount,
                amount: amount,
                transaction: transaction._id,
                type: "CREDIT"
            }], { session });

            transaction.status = "COMPLETED";
            await transaction.save({ session });

            await session.commitTransaction();
            session.endSession();

            //send email notification
            await emailService.sendTransactionEmail(
                req.user.email,
                req.user.name,
                amount,
                toAccount
            );

            return res.status(201).json({
                message: "Transaction completed successfully",
                transaction: transaction
            });

        } catch (err) {
            await session.abortTransaction();
            session.endSession();
            throw err;
        }

    } catch (err) {
        console.error('createTransaction error:', err);
        return res.status(500).json({
            message: 'Transaction failed',
            error: err.message
        });
    }
}


async function createInitialFundsTransaction(req, res) {
    try {

        const { toAccount, amount, idempotencyKey } = req.body;

        if (!toAccount || !amount || !idempotencyKey) {
            return res.status(400).json({
                message: "toAccount, amount and idempotencyKey are required"
            });
        }

        const toUserAccount = await accountModel.findById(toAccount);

        if (!toUserAccount) {
            return res.status(400).json({
                message: "Invalid toAccount"
            });
        }

        const systemUser = await userModel.findOne({ systemUser: true });

        if (!systemUser) {
            return res.status(400).json({
                message: "System user not found"
            });
        }

        const fromUserAccount = await accountModel.findOne({
            user: systemUser._id
        });

        if (!fromUserAccount) {
            return res.status(400).json({
                message: "System user account not found"
            });
        }

        const session = await mongoose.startSession();

        try {
            session.startTransaction();

            const [transaction] = await transactionModel.create([{
                fromAccount: fromUserAccount._id,
                toAccount,
                amount,
                idempotencyKey,
                status: "PENDING"
            }], { session });

            const debitLedgerEntry = await ledgerModel.create([{
                account: fromUserAccount._id,
                amount: amount,
                transaction: transaction._id,
                type: "DEBIT"
            }], { session });

            const creditLedgerEntry = await ledgerModel.create([{
                account: toAccount,
                amount: amount,
                transaction: transaction._id,
                type: "CREDIT"
            }], { session });

            transaction.status = "COMPLETED";
            await transaction.save({ session });

            await session.commitTransaction();
            session.endSession();

            return res.status(201).json({
                message: "Initial funds transaction completed successfully",
                transaction: transaction
            });

        } catch (err) {
            await session.abortTransaction();
            session.endSession();
            throw err;
        }

    } catch (err) {
        console.error('createInitialFundsTransaction error:', err);
        return res.status(500).json({
            message: 'Initial funds transaction failed',
            error: err.message
        });
    }
}


async function createUserTransaction(req, res) {
    try {

        const { toAccount, amount } = req.body;
        const fromUserId = req.user._id;

        if (!toAccount || !amount) {
            return res.status(400).json({
                message: "toAccount and amount are required"
            });
        }

        const fromUserAccount = await accountModel.findOne({ user: fromUserId });

        if (!fromUserAccount) {
            return res.status(400).json({
                message: "Your account not found"
            });
        }

        const toUserAccount = await accountModel.findById(toAccount);


        if (!toUserAccount) {
            return res.status(400).json({
                message: "Invalid recipient account"
            });
        }

        if (fromUserAccount.status !== "ACTIVE" || toUserAccount.status !== "ACTIVE") {
            return res.status(400).json({
                message: "Both accounts must be ACTIVE"
            });
        }

        const balance = await fromUserAccount.getBalance();

        if (balance < amount) {
            return res.status(400).json({
                message: `Insufficient balance. Current: ${balance}, Required: ${amount}`
            });
        }

        const idempotencyKey = `${fromUserAccount._id}-${toAccount}-${Date.now()}`;

        const session = await mongoose.startSession();

        try {
            session.startTransaction();

            const [transaction] = await transactionModel.create([{
                fromAccount: fromUserAccount._id,
                toAccount,
                amount,
                idempotencyKey,
                status: "PENDING"
            }], { session });

            const debitEntry = await ledgerModel.create([{
                account: fromUserAccount._id,
                amount,
                transaction: transaction._id,
                type: "DEBIT"
            }], { session });

            const creditEntry = await ledgerModel.create([{
                account: toAccount,
                amount,
                transaction: transaction._id,
                type: "CREDIT"
            }], { session });

            transaction.status = "COMPLETED";
            await transaction.save({ session });

            await session.commitTransaction();
            session.endSession();

            return res.status(201).json({
                message: "Transaction completed successfully",
                transaction: transaction
            });

        } catch (err) {
            await session.abortTransaction();
            session.endSession();
            throw err;
        }

    } catch (err) {
        return res.status(500).json({
            message: "Transaction failed",
            error: err.message
        });
    }
}


module.exports = {
    createTransaction,
    createInitialFundsTransaction,
    createUserTransaction
};