var mongoose=require("mongoose");

var reviewsSchema=new mongoose.Schema({
    
    rating:{
        type:Number,
        required:"Please provide a rating (1-5 stars).",
        min:1,
        max:5,
        validate:{
            
            validator:Number.isInteger,
            message: "{VALUE} is not an integer value."
        }
    },
    updatedAt:{type:Date,default:Date.now},
    text:{
        type:String
    },
    
    author:{
          id: {
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    username:String    
    },
    campground:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"campground"
    }
    },{
    timestamps:true
});

module.exports=mongoose.model("Review",reviewsSchema);