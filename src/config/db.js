const mongoose=require('mongoose');

function connectToDB(){
    mongoose.connect(process.env.MONGO_URI,{
        family:4
    })
    .then(()=>{
        console.log("server is connected to DB");
    })
   .catch(err => {
    console.log("Error connecting to DB")
    console.log(err)
    process.exit(1)
})

}

module.exports = connectToDB