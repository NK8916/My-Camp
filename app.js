var express   =require("express");

var app       =express();

var bodyParser=require("body-parser");

var mongoose  =require("mongoose");

var passport  =require("passport");

var flash=require("connect-flash");

var LocalStrategy=require("passport-local");

var User      =require("./models/user.js");

var seedDB    =require("./seed.js");

var CampgroundRoutes=require("./routes/campground");

var CommentRoutes=require("./routes/comments");

var IndexRoutes=require("./routes/index");

var reviewRoutes=require("./routes/reviews");

var methodOverride=require("method-override");

require('dotenv').config();

var url=process.env.DATABASEURL;

mongoose.connect(url,{useNewUrlParser:true});

app.use(bodyParser.urlencoded({extended:true}));

app.use(require("express-session")({
    
    secret:"This site ia awesome",
    
    resave:false,
    
  saveUnintialized:false
    
}));



app.use(flash());

app.use(passport.initialize());

app.use(passport.session());

app.use(methodOverride("_method"));

app.locals.moment=require("moment");

passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());

passport.deserializeUser(User.deserializeUser());

app.set("view engine","ejs");

app.use(express.static(__dirname + "/public"));

 // seedDB(); 

app.use(async function(req,res,next){
    if(req.user) {
    try {
      let user = await User.findById(req.user._id).populate('notifications', null, { isRead: false }).exec();
      res.locals.notifications = user.notifications.reverse();
    } catch(err) {
      console.log(err.message);
    }
   }
   res.locals.currentUser=req.user;
   res.locals.error=req.flash("error");
   res.locals.success=req.flash("success");
   next();
});

app.use("/",IndexRoutes);
app.use("/campgrounds",CampgroundRoutes);
app.use("/campgrounds/:id/comments",CommentRoutes);
app.use("/campgrounds/:id/reviews", reviewRoutes);

app.listen(process.env.PORT,process.env.IP,function(){
    
    console.log("listening");
    
    
});