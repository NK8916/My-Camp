var express = require("express");
var router = express.Router({mergeParams: true});
var campground = require("../models/campground");
var Review = require("../models/reviews");
var middleware = require("../middleware");

router.get("/",function(req,res){
    
    campground.findById(req.params.id).populate({
        path:"reviews",
        options:{sort:{createdAt:-1}}
    }).exec(function(err,foundcampground){
        
        if(err || !foundcampground)
        {
            req.flash("error","err.message");
            return res.redirect("back");
        }
        
        res.render("reviews/index",{camp:foundcampground});
    });
    
    
});

router.get("/new", middleware.isLoggedIn, middleware.checkReviewExistence,function(req,res){
    
    campground.findById(req.params.id,function(err,foundcampground){
        if(err)
        {
            req.flash("error","err.message");
            return res.redirect("back");
        }
        res.render("reviews/new",{camp:foundcampground});
        
    });
    
    
});

router.post("/",middleware.isLoggedIn, middleware.checkReviewExistence,function(req,res){
    
    campground.findById(req.params.id).populate("reviews").exec(function(err,foundcampground){
        
        if(err){
            req.flash("error",err.message);
            return res.redirect("back");
            
        }
        
        Review.create(req.body.review,function(err,review){
            
            if(err)
            {
                req.flash("error",err.message);
                return res.redirect("back");
            }
            
            review.author.id=req.user._id;
            review.author.username=req.user.username;
            review.foundcampground=foundcampground;
            review.save();
            foundcampground.reviews.push(review);
            foundcampground.rating=calculateAverage(foundcampground.reviews);
            foundcampground.save();
            req.flash("success","Your review is successfully added");
            res.redirect("/campgrounds/"+foundcampground._id);
        });
        
    });
    
    
    
});

function calculateAverage(reviews) {
    if (reviews.length === 0) {
        return 0;
    }
    var sum = 0;
    reviews.forEach(function (element) {
        sum += element.rating;
    });
    return sum / reviews.length;
}

router.get("/:review_id/edit",function(req,res){
    
    Review.findById(req.params.review_id,function(err, foundreview) {
        
        if(err)
        {
            req.flash("error",err.message);
            return res.redirect("back");
        }
        
        res.render("reviews/edit",{campground_id:req.params.id,review:foundreview});
        
        
    });
    
});

router.put("/:review_id",middleware.checkReviewOwnership,function(req,res){
    
    Review.findByIdAndUpdate(req.params.review_id,req.body.review,{new:true},function(err,updatedReview) {
        
         if (err) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        
        campground.findById(req.params.id).populate("reviews").exec(function(err, foundcampground) {
            
            if(err)
            {
                req.flash("error", err.message);
                return res.redirect("back");
            }
            foundcampground.rating=calculateAverage(foundcampground.reviews);
            foundcampground.save();
            req.flash("success", "Your review was successfully edited.");
            res.redirect('/campgrounds/' + foundcampground._id);
            
        });
        
    });

});

router.delete("/:review_id",middleware.checkReviewOwnership,function(req,res){
    
    Review.findByIdAndRemove(req.params.review_id,function(err){
        
        if(err){
            
             req.flash("error", err.message);
            return res.redirect("back");
        }
        
        campground.findByIdAndUpdate(req.params.id,{$pull: {reviews: req.params.review_id}}, {new: true}).populate("reviews").exec(function(err,foundcampground){
            
             if (err) {
                req.flash("error", err.message);
                return res.redirect("back");
            }
            
            foundcampground.rating=calculateAverage(foundcampground.reviews);
            foundcampground.save();
            req.flash("success", "Your review was deleted successfully.");
            res.redirect("/campgrounds/" + req.params.id);
            
        });
        
    });
    
    
    
});

module.exports=router;



