const express=require('express');
const app=express();
const ejs=require('ejs');
const bodyParser=require('body-parser');
const mongoose=require('mongoose');
const multer=require("multer");
const path=require("path")
var unirest = require("unirest");
const fs = require('fs');
const fast2sms = require('fast-two-sms')
var requestIp = require('request-ip');
const http = require("http");
const dns=require('dns');
var satelize = require('satelize');
var geoip = require('geoip-lite');
const axios = require("axios");
var twilio=require('twilio');   
var accountSid = "ACce0260cf664cb5c2857b125fabd3a3ab"; // Your Account SID from www.twilio.com/console
var authToken ="5bc6571e2aabcf50c24790c1eb0443ef"; 
var ip1="";
dns.lookup('www.geeksforgeeks.org', 
(err, addresses, family) => {
  
    // Print the address found of user
    console.log('addresses:', addresses);
    ip1=addresses;
  
    // Print the family found of user  
    console.log('family:', family);
});

var ip = require('what-is-my-ip-address');
var ip2="";
ip.v4()
  .then((ip) => {
    console.log(ip);
    ip2=ip;
  })
  .catch((error) => {
    // Do you have IP v4?
  });
// const requestListener = function (req, res) {
//   res.end("Your IP Addresss is: " + req.socket.localAddress);
// };

// const server = http.createServer(requestListener);
// console
// const PORT = process.env.PORT || 3000;
// server.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
// });
mongoose.connect('mongodb://localhost:27017/PawshungerDB',{useNewUrlParser:true});
const userSchema={
    name:String,
    email:String,
    password:String,
    pincode:String,
    contact:String,


}
const straySchema={
name:String,
contact:String,
longitude:String,
latitude:String,
address:String,
img:{
    data:Buffer,
    contentType:String
}

}
// shleter schema contains of name contact address image 
const shelterSchema={

    name:String,
    contact:String,
    address:String,
    pincode:String,
    img:
    {
        data: Buffer,
        contentType: String
    }


}
const donateSchema={
    name:String,
    contact:String,
    address:String,
    pincode:String,
    donatingItem:String,
    img:
    {
        data: Buffer,
        contentType: String
    },
    orderstatus:[String]


}
const Stray=mongoose.model('Stray',straySchema);
const Donate=mongoose.model('Donate',donateSchema);
const User=mongoose.model('User',userSchema);
const Shelter=mongoose.model('Shelter',shelterSchema);

app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static('public'));
app.get("/", function (req, res) {
   
    res.render("home");
  });
app.get("/form",(req,res)=>{
    res.render("form");
})
app.get('/community',(req,res)=>{
    res.render('community');
})
app.get('/upload',(req,res)=>{
    res.render('upload');
})
app.get('/donation',(req,res)=>{
    res.render('donation');
})
app.get("/nearmap",(req,res)=>{
Shelter.find({},(err,data)=>{
    if(err){
        console.log(err);
    }
    else{
        res.render("nearmap",{data:data});
    }
})
});
app.get("/ngo",(req,res)=>{
    res.render("ngo");


})

app.get("/paw",(req,res)=>{
    res.render("paw");
})
app.get("/register",(req,res)=>{
    res.render("register");
})
app.get('/sign',(req,res)=>{
    res.render('signup');
})
app.get('/home1',(req,res)=>{
    res.render('home1');
})
app.post('/userRegister',(req,res)=>{
    console.log(req.body);
    const user=new User({
        name:req.body.name,
        email:req.body.email,
        password:req.body.password,
        pincode:req.body.pincode,
        contact:req.body.contact,
    });

    user.save();

    res.redirect('/home1')


})
app.post('/login',(req,res)=>{
    console.log(req.body);
    User.findOne({email:req.body.email},(err,user)=>{
        if(err){
            return res.json({
                message:'Error Occured'
            });
        }
        if(!user){
            return res.json({
                message:'User Not Found'
            });
        }
        if(user.password!==req.body.password){
            return res.json({
                message:'Password Incorrect'
            });
        }
        return res.json({
            message:'Login Successful'
        });
    })
})

var storage5=multer.diskStorage({
	destination:(req,file,cb)=>{
		cb(null,'uploads')
	},
	filename:(req,file,cb)=>{
cb(null,file.fieldname+"-"+Date.now())
	}
});
var upload=multer({storage: storage5})
app.get('/help',(req,res)=>{
    Stray.find({},(err,data)=>{
        if(err){
            console.log(err);
        }
        else{
            res.render("helpus",{data:data});
        }
    
})
});
app.post('/uploadshelter',upload.single('image'),(req,res,next)=>{
    var obj=new Shelter({
        name:req.body.name,
        contact:req.body.contact,
        address:req.body.address,
        pincode:req.body.pincode,
        img:{

			data:fs.readFileSync(path.join(__dirname+'/uploads/'+req.file.filename)),
		contentType:'image/png'
		}
    })
    obj.save();
    User.findOne({pincode:req.body.pincode}, async (er,cd)=>{
        if(cd){
            var client=new twilio(accountSid,authToken);
    client.messages.create({
        body:`Hello ${cd.name}` +",we have a new shelter in your area.Please help us to find stray dogs "+req.body.name,
        to:`+91${cd.contact}`,
        from:"+18148460647"
    },(err,message)=>{
        console.log(message.sid);
    }
    )


        }
    })
});
var storage6=multer.diskStorage({
	destination:(req,file,cb)=>{
		cb(null,'upload1')
	},
	filename:(req,file,cb)=>{
cb(null,file.fieldname+"-"+Date.now())
	}
});
var upload=multer({storage: storage6})
app.post('/uploaddonate',upload.single('image'),(req,res,next)=>{
    
    var obj=new Donate({
        name:req.body.name,
        contact:req.body.contact,
        address:req.body.address,
        donatingItem:req.body.donatingItem,
        img:{
            data:fs.readFileSync(path.join(__dirname+'/upload1/'+req.file.filename)),
        contentType:'image/png'
        },
       
        orderstatus:['placed']
       //push obj to orderstatus


    })
    obj.save();
   // node mailer to notify ngo like
})
var storage7=multer.diskStorage({
	destination:(req,file,cb)=>{
		cb(null,'upload2')
	},
	filename:(req,file,cb)=>{
cb(null,file.fieldname+"-"+Date.now())
	}
});
var upload=multer({storage: storage7})
app.get('/org',(req,res)=>{
  Donate.find({},(err,data)=>{

    if(err){
        console.log(err);
    }
    else{
        res.render("org",{data:data});
    }
})
})
app.post('/uploadstray',upload.single('image'),(req,res,next)=>{
    if(req.body.address===""){
        const options = {
            method: 'GET',
            url: 'https://ip-geolocation-ipwhois-io.p.rapidapi.com/json/',
            params: {ip: ip1},
            headers: {
              'X-RapidAPI-Key': '919ad1b4efmsh5c64063fdf57b2ap1ecd82jsn8b07ec302f85',
              'X-RapidAPI-Host': 'ip-geolocation-ipwhois-io.p.rapidapi.com'
            }
          };
          
          axios.request(options).then(function (response) {
            console.log("long",response.data.longitude)
            console.log("lat",response.data.latitude)

            var obj=new Stray({
                name:req.body.name,
                contact:req.body.contact,
                longitude:response.data.longitude,
                latitude:response.data.latitude,
                img:{
                    data:fs.readFileSync(path.join(__dirname+'/upload2/'+req.file.filename)),
                contentType:'image/png'
                }
            })
            obj.save();
            if(obj){
                return res.json({
                    message:'Stray Uploaded Successfully'
                })
            }
    
          }).catch(function (error) {
              console.error(error);
          });
          
    }else{
    var obj=new Stray({
        name:req.body.name,
        contact:req.body.contact,
        address:req.body.address,
        img:{
            data:fs.readFileSync(path.join(__dirname+'/upload2/'+req.file.filename)),
        contentType:'image/png'
        }
    })
    obj.save();
    if(obj){
        return res.json({
            message:'Stray Uploaded Successfully'
        })
    }
}
    
   // node mailer to notify ngo like

})
app.get('/location',(re,res)=>{
    
  var apiCall = unirest("GET",
  "https://ip-geolocation-ipwhois-io.p.rapidapi.com/json/"
);
apiCall.headers({
    'X-RapidAPI-Key': '919ad1b4efmsh5c64063fdf57b2ap1ecd82jsn8b07ec302f85',
    'X-RapidAPI-Host': 'ip-geolocation-ipwhois-io.p.rapidapi.com'
});
apiCall.end(function(result) {
  if (res.error) throw new Error(result.error);
  console.log(result.body);
  res.send(result.body);
});
});

app.post('/updatestatus',(req,res)=>{
    const status=req.body.status;
    
Donate.findOneAndUpdate({_id:req.body.id},{$set:{orderstatus:status}},(err,data)=>{
    if(err){
        console.log(err);
    }
    else{
        var client=new twilio(accountSid,authToken);
        client.messages.create({
            body:`Hello ${data.name} `+ ",we have a update on your pick up order "+req.body.status+" is your current status",
            to:`+91${data.contact}`,
            from:"+18148460647"
        },(err,message)=>{
            console.log(message.sid);
        }
        )
        return res.json({
            message:'Status Updated Successfully'
        })
    }
})
});


app.listen(80,(req,res)=>{
    console.log('Server is running on port 80');
})
