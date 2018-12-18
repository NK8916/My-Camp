var mongoose=require("mongoose");
var passportLocalMongoose=require("passport-local-mongoose");

var UserSchema=new mongoose.Schema({
   username:{type:String,unique:true,required:true}, 
    password:String,
    notifications:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Notification"
    }],
    followers:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    }],
    image:String,
    imageId:String,
    firstname:String,
    lastname:String,
    email:{type:String,unique:true,required:true},
    resetPasswordToken:String,
    resetPasswordExpires:Date
    ,
    
});

UserSchema.plugin(passportLocalMongoose);

module.exports=mongoose.model("User",UserSchema);