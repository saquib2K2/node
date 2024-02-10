const express = require ("express");
const forgot = express();
const mongoose=require("mongoose")
forgot.use(express.json())
const cors = require("cors");
forgot.use(cors());
const bcrypt = require("bcryptjs");
forgot.set("view engine", "ejs");
forgot.use(express.urlencoded({extended:false}));

const jwt = require("jsonwebtoken");
var nodemailer = require('nodemailer');

const JWT_SECRET= "lkjgrjgdu09834uoiejoie87tgpiuurg9gj34p9tug0jg0uhg8fej[][428gfhgij";

const mongoUrl="mongodb+srv://calmconnect:TYELSa3YhKuqc4d2@cluster0.z9ztty3.mongodb.net/?retryWrites=true&w=majority";

mongoose.connect(mongoUrl,{
    useNewUrlParser: true,
})
.then(() => {
    console.log("Connected to database");
})
.catch((e) => console.log(e));

require("./userDetails");

const User = mongoose.model("UserInfo");

forgot.post("/register", async (req, res) => {
    const { email, password } = req.body;
  
    const encryptedPassword = await bcrypt.hash(password, 20);
    try {
      const oldUser = await User.findOne({ email });
  
      if (oldUser) {
        return res.json({ error: "User Exists" });
      }
      await User.create({
        email,
        password: encryptedPassword,
      });
      res.send({ status: "ok" });
    } catch (error) {
      res.send({ status: "error" });
    }
  });

  forgot.post("/login-user", async (req, res) => {
    const { email, password } = req.body;
  
    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ error: "User Not found" });
    }
    if (await bcrypt.compare(password, user.password)) {
      const token = jwt.sign({ email: user.email }, JWT_SECRET);
  
      if (res.status(201)) {
        return res.json({ status: "ok", data: token });
      } else {
        return res.json({ error: "error" });
      }
    }
    res.json({ status: "error", error: "InvAlid Password" });
  });

  forgot.post("/userData", async (req, res) => {
    const { token } = req.body;
    try {
      const user = jwt.verify(token, JWT_SECRET);
      const useremail = user.email;
      User.findOne({ email: useremail })
      .then((data) => {
        res.send({ status: "ok", data: data});
      })
      .catch((error) => {
        res.send({ status: "error", data: error});
      });
    } catch (error) {}
  });

forgot.listen(5000, () => {
    console.log("Server is running on port 5000");
});

forgot.post("/forgot-password", async (req,res) => {
  const{email} = req.body;
  try {
    const oldUser = await User.findOne({ email });
    if(!oldUser) {
      return res.json({ status: "User Not Exists" });
    }
    const secret = JWT_SECRET + oldUser.password;
    const token = jwt.sign({ email: oldUser.email, id: oldUser._id }, secret, {
    expiresIn: "5m",
  });
    const link = `http://localhost:5000/reset-password/${oldUser._id}/${token}`;
    var transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "calmconnectt@gmail.com",
        pass: "ouhdwqodkkgciwsz"
      }
    });
    
    var mailOptions = {
      from: "calmconnectt@gmail.com",
      to: "shekhawatdevanshu9@gmail.com",
      subject: "Password Reset",
      text: link,
    };
    
    transporter.sendMail(mailOptions, function(error, info){
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent: " + info.response);
        alert("Email sent")
      }
    });
    console.log(link);
  } catch (error) {}
});

forgot.get("/reset-password/:id/:token", async (req,res) => {
  const { id, token } = req.params;
  console.log(req.params);
  const oldUser = await User.findOne({ _id:id });
  if(!oldUser) {
    return res.json({ status: "User Not Exists" });
  }
  const secret = JWT_SECRET + oldUser.password;
  try {
    const verify = jwt.verify(token, secret);
    res.render("index", {email: verify.email, status: "Not Verified" });
  } catch (error) {
    console.log(error);
    res.send("Not Verified");
  }  
});


forgot.post("/reset-password/:id/:token", async (req,res) => {
  const { id, token } = req.params;
  const{ password } = req.body;

  const oldUser = await User.findOne({ _id:id });
  if(!oldUser) {
    return res.json({ status: "User Not Exists" });
  }
  const secret = JWT_SECRET + oldUser.password;
  try {
    const verify = jwt.verify(token, secret);
    const encryptedPassword = await bcrypt.hash(password, 20);
    await User.updateOne(
      {
        _id: id,
      },
      {
        $set: {
          password: encryptedPassword,
        },
      }
    );
    res.json({status: "Password Updated" });

    res.render("index", {email: verify.email, status: "Verified" });
  } catch (error) {
    console.log(error);
    res.json({status: "Something Went Wrong" });
  }  
});

//forgot.post("/post", async (req, res) =>{
//    console.log(req.body);
//    const {data}=req.body

//try {
//    if(data=="devanshu"){
//        res.send({status:"ok"})
//    }else{
//        res.send({status: "User not found"});
//    }  
//} catch (error) {
//    res.send({status: 'Error'});  
//} 
//});

