var mongoose=require("mongoose");
var campSchema=new mongoose.Schema({
    
    name:String,
    
    price:Number,
    
    image:String,
    
    imageId:String,
    
    desc:String,
    
    createdAt:{type:Date,default:Date.now},
    
    author:{
      id:{
          type:mongoose.Schema.Types.ObjectId,
          
          ref:"User"
          
      },
      
      username:String
        
    },
    
    comments:[{
        
        type:mongoose.Schema.Types.ObjectId,
        ref:"Comment"
    }],
    reviews:[{
        
        type:mongoose.Schema.Types.ObjectId,
        ref:"Review"
    }],
    rating:{
        type:Number,
        default:0
    }
});

module.exports=mongoose.model("campground",campSchema);
