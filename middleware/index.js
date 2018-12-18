var campground=require("../models/campground.js");

var Comment=require("../models/comment.js");

var Review = require("../models/reviews");

var middlewareObj={};

middlewareObj.checkCampgroundOwnership=function(req,res,next){
    
    if(req.isAuthenticated())
    {
        campground.findById(req.params.id,function(err, foundCamp) {
            
            if(err)
            {
                console.log(err);
            }
            
            else
            {
                if(req.user._id.equals(foundCamp.author.id))
                {
                    next();
                    
                }
                
                else{
                     req.flash("error","You Dont Have Permission For That");
                    res.redirect("back");
                }
            }
            
        });
        
    }
    
    else{
        
          
        req.flash("error","You Need To Be Logged In");
        res.redirect("back");
        
    }
    
}

middlewareObj.checkCommentOwnership=function(req,res,next){
    
    if(req.isAuthenticated())
    {
        Comment.findById(req.params.comment_id,function(err, foundComment) {
            
            if(err)
            {
                console.log(err);
            }
            
            else
            {
                if(req.user._id.equals(foundComment.author.id))
                {
                    next();
                    
                }
                
                else{
                    req.flash("error","You Dont Have Permission For That");
                    res.redirect("back");
                }
            }
            
        });
        
    }
    
    else{
        
        req.flash("error","You Need To Be Logged In");
        res.redirect("back");
        
    }
    
}

 middlewareObj.isLoggedIn=function(req,res,next){
    
    if(req.isAuthenticated()){
        
        return next();
    }
    
    req.flash("error","You Need To Be Logged In");
    
    res.redirect("/login");
}


middlewareObj.checkReviewOwnership=function(req,res,next){
    
    if(req.isAuthenticated())
    {
        Review.findById(req.params.review_id,function(err, foundReview) {
            
            if(err || !foundReview)
            {
                res.redirect("back");
            }
            
            else
            {
                 if(foundReview.author.id.equals(req.user._id)) {
                    next();
                 }
                 
                 
                  else {
                    req.flash("error", "You don't have permission to do that");
                    res.redirect("back");
                }
            }
        });
        
    }
        
        else {
        req.flash("error", "You need to be logged in to do that");
        res.redirect("back");
    }
    
    
    
};

middlewareObj.checkReviewExistence=function(req,res,next){
    
    if(req.isAuthenticated())
    {
        campground.findById(req.params.id).populate("reviews").exec(function(err,foundcampground){
            
            if(err || !foundcampground)
            {
                req.flash("error", "Campground not found.");
                res.redirect("back");
            }
            
            else{
                
                var foundUserReview=foundcampground.reviews.some(function(review){
                    
                    return review.author.id.equals(req.user._id);
                    });
            
                if(foundUserReview){
                     req.flash("error", "You already wrote a review.");
                    return res.redirect("back");
                    
                }
                next();
                
            }
            
            
            
        });
    }
    
    else {
        req.flash("error", "You need to login first.");
        res.redirect("back");
    }
    
};

module.exports=middlewareObj;