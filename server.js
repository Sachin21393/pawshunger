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
var ip1="";
dns.lookup('www.geeksforgeeks.org', 
(err, addresses, family) => {
  
    // Print the address found of user
    console.log('addresses:', addresses);
    ip1=addresses;
  
    // Print the family found of user  
    console.log('family:', family);
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
    orderStatus: [{
        status: { type: String, enum: ["Awaiting Quotation", "Quotation Accepted", "Placed", "Accepted", "Confirmed", "Edited", "Payment Pending", "Out for Delivery", "Delivered", "Rejected", "Cancelled"], default: "Placed" },
        updatedAt: { type: Date, default: Date.now },
      }],


}

const Donate=mongoose.model('Donate',donateSchema);
const User=mongoose.model('User',userSchema);
const Shelter=mongoose.model('Shelter',shelterSchema);

app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static('public'));
app.get("/", function (req, res) {
    
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
          console.log(response.data.latitude);
          console.log(response.data.longitude);

      }).catch(function (error) {
          console.error(error);
      });
  });

app.post('/send',async (req,res)=>{
    var options =await fast2sms.sendMessage( {authorization : 'Uom7yaq1ZvkwIfxHT3lAjK6D9zdVGMRNSJeQtFYgEB8s5X0pWceoP0Xbx3Q9vLsZq2HKdRpcDB4wmFrG', message : 'heelo' ,  numbers : [req.body.contact]} )
    res.send(options)
    console.log(options)
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

    return res.json({
        message:'User Registered Successfully'
    });


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

app.post('/uploadshelter',upload.single('image'),(req,res,next)=>{
    var obj=new Shelter({
        name:req.body.name,
        contact:req.body.contact,
        address:req.body.address,
        img:{
			data:fs.readFileSync(path.join(__dirname+'/uploads/'+req.file.filename)),
		contentType:'image/png'
		}
    })
    obj.save();
    User.findOne({pincode:req.body.pincode}, async (er,cd)=>{
        if(cd){
            console.log(cd.contact)
            var options =await fast2sms.sendMessage( {authorization : "Uom7yaq1ZvkwIfxHT3lAjK6D9zdVGMRNSJeQtFYgEB8s5X0pWceoP0Xbx3Q9vLsZq2HKdRpcDB4wmFrG", message : 'heelo' ,  numbers : ['7738872498']} )
          res.send(options)
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
app.post('/uploaddonate',(req,res)=>{
    var obj=new Donate({
        name:req.body.name,
        contact:req.body.contact,
        address:req.body.address,
        donatingItem:req.body.donatingItem,
        img:{
            data:fs.readFileSync(path.join(__dirname+'/upload1/'+req.file.filename)),
        contentType:'image/png'
        }
    })
    obj.save();
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
    
    Donate.findOneAndUpdate({
     _id:req.body.id
    }, {
        $push: {
            orderStatus: {
                status: status,
            }
        }
    }, {
        new: true,
        upsert: true
    }).sort({ updatedAt: -1 });
})


app.listen(80,(req,res)=>{
    console.log('Server is running on port 80');
})
