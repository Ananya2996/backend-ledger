require('dotenv/config');
const connectToDB = require("./src/config/db")
const app = require("./src/app")

connectToDB()

console.log("Loaded Secret:", process.env.JWT_SECRET)

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});


