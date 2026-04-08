const userModel = require("../models/user.model")
const jwt = require('jsonwebtoken')
const emailService = require("../services/email.service")
const tokenBlackListModel=require("../models/BlackList.model")

async function authMiddleware(req, res, next){
    console.log("Cookies received:", req.cookies);
    const token=req.cookies.token || req.headers.authorization?.split(" ")[1];
      console.log("Token extracted:", token);
    if(!token){
        return res.status(401).json({
            message:"unauthorized access,Token is missing"
        })
    }
    try{
      
        const decoded=jwt.verify(token, process.env.JWT_SECRET)

        const user=await userModel.findById(decoded.userId)

        console.log('Decoded token userId:', decoded.userId)
        if(!user){
            return res.status(401).json({
                message: "unauthorized access, user not found"
            })
        }

        req.user = user
        return next()

    }catch(err){

        return res.status(401).json({
             message:"unauthorized access,Token is invaild"
        })
    }
}
async function authSystemMiddleware(req, res, next){
       const token=req.cookies.token || req.headers.authorization?.split(" ")[1]
       if(!token){
        return res.status(401).json({
            message:"Unauthorized access, token is missing"
        })
       }
       const isBlacklisted=await tokenBlackListModel.findOne({ token })

       if(isBlacklisted){
        return res.status(401).json({
            message:"Unauthorized access, token is invalid"
        })
       }

     
       try{
          const decoded=jwt.verify(token, process.env.JWT_SECRET)

                    console.log('Decoded token userId (system):', decoded.userId)
                    const user=await userModel.findById(decoded.userId).select("+systemUser")
                    if(!user){
                        return res.status(401).json({
                                message: "unauthorized access, user not found"
                        })
                    }
                    if(!user.systemUser){
                        return res.status(403).json({
                                message:"forbidden access, not a system user"
                        })
                    }
                    req.user=user
                    return next()

       }
       catch(err){
        return res.status(401).json({
            message:"unauthorized access, token is invalid"
        })
       }
}

module.exports={
    authMiddleware,
    authSystemMiddleware
}