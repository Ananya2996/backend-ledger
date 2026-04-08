const express = require('express')
const cookieParser = require("cookie-parser")
const cors = require('cors')

const app=express()

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}))

app.use(express.json())
app.use(cookieParser())

const authRouter= require("./routes/auth.routes")
const accountRouter=require("./routes/account.routes")
// explicit .js extension avoids accidentally loading a stray file without one
const transactionRoutes=require("./routes/transaction.routes.js")

app.use("/api/auth",authRouter)
app.use("/api/accounts", accountRouter)
app.use("/api/transactions", transactionRoutes)

module.exports=app