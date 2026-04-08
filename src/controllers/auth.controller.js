const userModel=require("../models/user.model")
const jwt=require("jsonwebtoken")
const emailService=require("../services/email.service")
const tokenBlackListModel = require("../models/BlackList.model")


//user register controller
 async function userRegisterController(req,res){
    
    const {email,password,name}=req.body

    const isExists=await userModel.findOne({
        email:email
    })

    if(isExists){
        return res.status(422).json({
            messagae:"user already exists",
            status:"failed"
        })
    }
    const user=await userModel.create({
        email, password, name
    })

    const token=jwt.sign(
        {userId:user._id}, process.env.JWT_SECRET,{expiresIn: "3d"})
    res.cookie("token" , token)
    res.status(201).json({
        user:{
            _id:user._id,
            email:user.email,
            name:user.name
        },
        token
    })

    await emailService.sendRegisterEmail(user.email , user.name)
}

//user login controller

async function userLoginController(req,res){
    const {email, password}=req.body

const user = await userModel.findOne({ email }).select("+password");


    if(!user){
        return res.status(401).json({
            message:"email or password is invalid"
        })  
    }
    const isValidPassword=await user.comparePassword(password)

      if(!isValidPassword){
        return res.status(401).json({
            message:"email or password is invalid"
        })  
    }

    const token=jwt.sign(
        {userId:user._id}, process.env.JWT_SECRET,{expiresIn: "3d"})
           console.log("Generated token:", token)
    res.cookie("token" , token)
    res.status(200).json({
        user:{
            _id:user._id,
            email:user.email,
            name:user.name
        },
        token
    })

}
async function userLogoutController(req,res){
    const token=req.cookies.token || req.headers.authorization?.split(" ")[1]
    if(!token){
        return res.status(400).json({
            message:"User logged out successfully"
        })
    }
    res.cookie("token","")

    await tokenBlackListModel.create({
        token:token
    })

    res.status(200).json({
        message:"User logged out successfully"
    })
}



module.exports={
    userRegisterController,
    userLoginController,
    userLogoutController
}