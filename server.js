require('dotenv').config()
const app = require("./src/app")
const connectToDB = require("./src/config/db")

connectToDB()

console.log("Loaded Secret:", process.env.JWT_SECRET)

app.listen(3000, ()=>{
    console.log("Server is running on port 3000");
})



