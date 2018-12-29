var express   =require("express");

var router    =express.Router();

var campground=require("../models/campground");

var Comment   =require("../models/comment");

var middleware=require("../middleware");

var multer   =require("multer");

var Notification=require("../models/notification");

var User     =require("../models/user"); 

var Review = require("../models/reviews");

var storage  =multer.diskStorage({
    filename:function(req,file,callback){
        callback(null,Date.now()+file.originalname);
    }
});

var imageFilter=function(req,file,cb)
{
    if(!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)){
        
        return cb(new Error('Only image files are allowed'),false);
    }
    
    cb(null,true);
};


var upload=multer({storage:storage,fileFilter:imageFilter});

var cloudinary=require("cloudinary");

cloudinary.config({
    cloud_name:'nk987',
    api_key:process.env.API_KEY,
    api_secret:process.env.API_SECRET
});



router.get("/",function(req,res){
    var perPage = 8;
    var pageQuery = parseInt(req.query.page);
    var pageNumber = pageQuery ? pageQuery : 1;
    var noMatch=null;
    if(req.query.search) {
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
        campground.find({name: regex}).skip((perPage * pageNumber) - perPage).limit(perPage).exec(function (err, allCampgrounds) {
            campground.count({name: regex}).exec(function (err, count) {
                if (err) {
                    console.log(err);
                    res.redirect("back");
                } else {
                    if(allCampgrounds.length < 1) {
                        noMatch = "No campgrounds match that query, please try again.";
                    }
                    res.render("campgrounds/index", {
                        camps: allCampgrounds,
                        current: pageNumber,
                        pages: Math.ceil(count / perPage),
                        noMatch: noMatch,
                        search: req.query.search
                    });
                }
            });
        });
    } else {
        campground.find({}).skip((perPage * pageNumber) - perPage).limit(perPage).exec(function (err, allCampgrounds) {
            campground.count().exec(function (err, count) {
                if (err) {
                    console.log(err);
                } else {
                    res.render("campgrounds/index", {
                        camps: allCampgrounds,
                        current: pageNumber,
                        pages: Math.ceil(count / perPage),
                        noMatch: noMatch,
                        search: false
                    });
                }
            });
        });
    }
});


router.post("/", middleware.isLoggedIn, upload.single('image') , function(req, res){

cloudinary.v2.uploader.upload(req.file.path,async function(err,result){
    
    if(err) {
        req.flash('error', err.message);
        return res.redirect('back');
      }
    
    req.body.campground.image = result.secure_url;
    req.body.campground.imageId = result.public_id;
   req.body.campground.author={
        id:req.user._id,
       username:req.user.username
    };
    
    try{
        let newCamp=await campground.create(req.body.campground);
        let user=await User.findById(req.user._id).populate('followers').exec();
        let newNotification={
            username:req.user.username,
            campgroundId:newCamp.id
        };
    
    
    for(const follower of user.followers)
    {
        let notification = await Notification.create(newNotification);
        follower.notifications.push(notification);
        follower.save();
    }
    
     res.redirect("/campgrounds/"+newCamp.id);
    
    }
    catch(err){
        
     req.flash("error",err.message);
     return res.redirect("back");
        
    }
    
    
      });
  
  
  });
 



router.get("/new",middleware.isLoggedIn,function(req,res){
    
    res.render("campgrounds/new");
    
});

router.get("/:id",function(req, res) {
    
    campground.findById(req.params.id).populate("comments").populate({
        
        path:"reviews",
        options:{sort:{createdAt:-1}}
        
    }).exec(function(err,found){
        
        if(err){
            
            console.log(err);
            
        }
        
        else
        {
            console.log(found);
            
            res.render("campgrounds/show",{camp:found});
            
        }
        
        
    });
    
});

router.get("/:id/edit",middleware.checkCampgroundOwnership,function(req, res) {
    
    campground.findById(req.params.id,function(err,foundCamp){
        
        if(err)
        {
            console.log(err);
            res.redirect("/campgrounds");
        }
        
        else
        {
            res.render("campgrounds/edit",{campground:foundCamp});
            
        }
        
    });
    
    
});


router.put("/:id", middleware.checkCampgroundOwnership,upload.single('image'), function(req, res){
    
    delete req.body.campground.rating;
     campground.findById(req.params.id, async function(err, campground){
       if(err){
            req.flash("error", err.message);
            res.redirect("back");
        } else {
            if (req.file) {
              try {
                  await cloudinary.v2.uploader.destroy(campground.imageId);
                  var result = await cloudinary.v2.uploader.upload(req.file.path);
                  campground.imageId = result.public_id;
                  campground.image = result.secure_url;
              } catch(err) {
                  req.flash("error", err.message);
                  return res.redirect("back");
              }
            }
            campground.name = req.body.name;
            campground.desc = req.body.desc;
            campground.price=req.body.price;
            campground.save();
            req.flash("success","Successfully Updated!");
            res.redirect("/campgrounds/" + campground._id);
        }
    });
});

router.delete("/:id",middleware.checkCampgroundOwnership,function(req,res){
    
    campground.findById(req.params.id,async function(err,campgrounds){
        
        if(err)
        {   
            req.flash("error","err.message");
            return res.redirect("/campgrounds");
            
        }
        
        Comment.remove({"_id":{$in:campgrounds.comments}},function(err){
            
            if(err){
                console.log(err);
                return res.redirect("/campgrounds");
            }
            
            Review.remove({"_id":{$in:campgrounds.reviews}},function(err){
                
                if(err)
                {
                    console.log(err);
                    return res.redirect("/campgrounds");
                }
                
                 campgrounds.remove();
                req.flash("success", "Campground deleted successfully!");
                res.redirect("/campgrounds");
                
            });
            
            
        });
        
         /* try{
             await cloudinary.v2.uploader.destroy(campgrounds.imageId);
            campgrounds.remove();
            req.flash("success","Successfully Deleted");
            res.redirect("/campgrounds");
            
        }
        
        catch(err){
            
            req.flash("error", err.message);
                  return res.redirect("back");
            
        } */
      
        
    });
    
});

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

module.exports=router;