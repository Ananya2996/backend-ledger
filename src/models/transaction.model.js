const mongoose=require("mongoose")

const transactionSchema=new mongoose.Schema({
    fromAccount:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"account",
        required:[true, "Transaction must be associated wuth a from account"],
        index:true
    },
    toAccount:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"account",
        required:[true, "Transaction must be associated wuth a from account"],
        index:true
    },
    status:{
        type:String,
        enum:{
            values:["PENDING","COMPLETED", "FAILED", "REVERSED"],
            message:"Status can be either pending , completed, failed or reversed",
        },
        default:"pending"
    },
    amount:{
      type:Number,
      required:[true, "Amount is required for creating a transaction"],
      min:[0, "Transaction amount cannot be negative"]
    },

    //generated on client side
    idempotencyKey:{
        type:String,
        required:[true, "Idempotency key is requuierd for creating a transaction"],
        index:true,
        unique:true
    }
},{
   timestamps:true
})

const transactionModel=mongoose.model("transaction", transactionSchema)

module.exports=transactionModel