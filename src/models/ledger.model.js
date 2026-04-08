const mongoose=require('mongoose');

const ledgerSchema= new mongoose.Schema({
    account:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"account",
        required:[true, "ledger must be associated with an account"],
        index:true,
        immutable:true,
    },
    amount:{
         type:Number,
        required:[true, "Amount is requured for creatinga ledger entry"],
        immutable:true,
    },
    transaction:{
         type:mongoose.Schema.Types.ObjectId,
        ref:"transaction",
        required:[true, "ledger must be associated with an transaction"],
        index:true,
        immutable:true,
    },
    type:{
        type:String,
        enum:{
            values:["CREDIT", "DEBIT"],
            message:"Type can be either credit or debit",
        },
        required:[true, "ledger type is required"],
        immutable:true
    }
}, { timestamps: true });

function preventLedgerModification(next){
    throw new Error("ledger entries are immutabel and cannot be modified or deleted")
}

ledgerSchema.pre('findOneAndUpdate', preventLedgerModification);
ledgerSchema.pre('updateOne', preventLedgerModification);
ledgerSchema.pre('deleteOne', preventLedgerModification);
ledgerSchema.pre('deleteMany', preventLedgerModification);
ledgerSchema.pre('updateMany', preventLedgerModification);
ledgerSchema.pre('findOneAndDelete', preventLedgerModification);
ledgerSchema.pre('findOneAndReplace', preventLedgerModification);


const ledgerModel=mongoose.model('ledger', ledgerSchema);

module.exports=ledgerModel;
