 var express=require("express");
 var router=express.Router();
 var User=require("../models/user");
 var passport  =require("passport");
 var campground =require("../models/campground");
 var async =require("async");
 var nodemailer=require("nodemailer");
 var crypto=require("crypto");
 var smtpTransport = require('nodemailer-smtp-transport');
 var middleware=require("../middleware");
 var Notification=require("../models/notification");
 var multer   =require("multer");
 
 
router.get("/",function(req,res){
    
    
    res.render("landing");
});

router.get("/register",function(req, res) {
    
    res.render("signup",{page:'register'});
});

router.post("/register",function(req, res) {
    
         
         var newUser=new User({
        username:req.body.username,
        password:req.body.password,
        firstname:req.body.firstname,
        lastname:req.body.lastname,
        image:req.body.image,
        imageId:req.body.imageId,
        email:req.body.email
    });
    
  
      User.register(newUser,req.body.password,function(err,user){
        
        if(err)
        {
            console.log(err);
             req.flash("error",err.message);
            return res.redirect("/register");
            
        }
        
        else{
            
            passport.authenticate("local")(req,res,function(){
                
                 req.flash("success","Successfully Registered!");
                res.redirect("/campgrounds");
                
            });
            
        }
        
    });
    
        
});    
    

router.get("/login",function(req, res) {
    
    res.render("login",{page:'login'});
});

router.post("/login",passport.authenticate("local",{
    
    successRedirect:"/campgrounds",
    
    failureRedirect:"/login"
    
}),function(req,res){
});

router.get("/logout",function(req, res) {
    
    req.logout();
    
    req.flash("success","Logged You Out !!!");
    
    res.redirect("/campgrounds");

});

router.get("/users/:id",async function(req, res) {
   
   try{
       
       let user= await User.findById(req.params.id);
       
       let campgrounds = await campground.find().where('author.id').equals(user._id).exec();
       
        res.render("users/show",{user:user,campgrounds:campgrounds}); 
   }
    
       catch(err)
       {
            req.flash("error","Something Went Wrong");
            res.redirect("/");
           
       }
      
});

router.get("/follow/:id",async function(req,res){
    
    try{
        let user=await User.findById(req.params.id);
        user.followers.push(req.user._id);
        user.save();
        req.flash("success","Successfully followed " + user.username);
        res.redirect("/users/"+req.params.id);
    }
    
    
    catch(err){
        req.flash("error",err.message);
        res.redirect("back");
    }

});

router.get("/notifications",middleware.isLoggedIn,async function(req,res){
    
    try{
        let user=await User.findById(req.user._id).populate({
            path:"notifications",
            options:{sort:{"_id":-1}}
        }).exec();
        
        let allNotifications=user.notifications;
        
        res.render("notifications/index",{allNotifications});
    }
    
    catch(err){
        req.flash("error",err.message);
        res.redirect("back");
    }
    
    
});

router.get("/notifications/:id",middleware.isLoggedIn,async function(req, res) {
    
    try{
        
        let notification=await Notification.findById(req.params.id);
        notification.isRead=true;
        notification.save();
        res.redirect("/campgrounds/"+notification.campgroundId);
    }
    
    catch(err){
        req.flash("error",err.message);
        res.redirect("back");
    }
    
});

router.get("/forgot",function(req, res) {
    res.render("forgot");
});

router.post("/forgot",function(req,res,next){
    
    async.waterfall([
        function(done){
            
            crypto.randomBytes(20,function(err,buf){
                var token=buf.toString('hex');
                done(err,token);
            });
            
        },
        function(token,done){
            User.findOne({email:req.body.email},function(err,user){
                
                if(!user)
                {
                    req.flash("error","No account exists with that email address");
                    return res.redirect("/forgot");
                }
                
                user.resetPasswordToken=token;
                user.resetPasswordExpires=Date.now() + 360000;
                
                user.save(function(err){
                    done(err,token,user);
                });
                
            });
            
        },
        
        function(token,user,done)
        {
            var Transporter=nodemailer.createTransport(smtpTransport({
                service:'gmail',
                host: 'smtp.gmail.com',
                port: 587,
                secure: false,
                requireTLS: true,
                auth:{
                    user:'phonebat987@gmail.com',
                    pass:process.env.GMAIL_PASS
                    
                }
            }));
            
            var mailOptions={
                to:user.email,
                from:'phonebat987@gmail.com',
                subject:'Reset Your Password',
                text:'You requested the reset of the password.\n\n' + 
                'please click the following link\n\n' + 
                'http://' + req.headers.host + '/reset/' + token +'\n\n' +
                'If you did not request this, please ignore this email and your password will remain unchanged.\n'
            };
            
            Transporter.sendMail(mailOptions,function(err){
                console.log('mail sent');
                req.flash("success","mail has been sent to " + user.email + " with further instructions");
                done(err,'done');
                
            });
            
        }],
        function(err){
            if(err) return next(err);
            res.redirect("/forgot");
        });
});

router.get("/reset/:token",function(req, res) {
    
    User.findOne({resetPasswordToken:req.params.token,resetPasswordExpires:{$gt:Date.now()}},function(err,user){
        
        if(!user){
            
            req.flash("error","password reset token is invalid or has expired");
            return res.redirect("/forgot");
            
        }
        
        else{
            res.render("reset",{token:req.params.token});
        }
        
    });
    

    
});

router.post("/reset/:token",function(req, res) {
    
    async.waterfall([
        function(done){
            User.findOne({resetPasswordToken:req.params.token,resetPasswordExpires:{$gt:Date.now()}},function(err,user){
                
                if(!user)
                {
                    req.flash("error","You reset token is invalid or has expired");
                    return res.redirect("back");
                }
                
                else
                {
                    if(req.body.password===req.body.confirm)
                    {
                        user.setPassword(req.body.password,function(err){
                            
                            user.resetPasswordToken=undefined;
                            user.resetPasswordExpires=undefined;
                            
                            user.save(function(err){
                                
                                req.logIn(user,function(err){
                                    
                                    done(err,user);
                                });
                                
                            });
                            
                        });
                    }
                    
                    else
                    {
                        req.flash("error","password do not match");
                        res.redirect("back");
                    }
                }
                
            });
        },
        
        function(user,done){
            
           var Transporter=nodemailer.createTransport(smtpTransport({
                service:'gmail',
                host: 'smtp.gmail.com',
                auth:{
                    user:'phonebat987@gmail.com',
                    pass:process.env.GMAILPW
                    
                }
            }));
                
               var mailOptions={
                to:user.email,
                from:'phonebat987@gmail.com',
                subject:'Your password has been changed',
                text:'Hello,\n\n' + 
                'Your password for account ' + user.email + 'has been changed.\n'
            };
            
                Transporter.sendMail(mailOptions,function(err){
                    
                    console.log('mail sent again');
                    req.flash("success","Your password has been changed successfully");
                    done(err);
                });
            
        }
        ],
        
        function(err){
            
            res.redirect('/campgrounds');
        });
    
});

module.exports=router;