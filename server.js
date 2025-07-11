const express = require('express');
/*  const bodyParser=require('body-parser');  */
const multer = require('multer');
const path = require('path');
const app = express();
const mongoose = require('mongoose');
app.use(express.json());
const bcrypt=require('bcryptjs');
const jwt=require('jsonwebtoken');
const session=require('express-session');
const { default: AsyncStorage } = require('@react-native-async-storage/async-storage');
const cors = require('cors');
const { ObjectId } = require('bson');
app.use(cors());
app.use(express.urlencoded({extended:true}));
app.use('/uploads', express.static('uploads'));

const JWT_SECRET='SECRET123';





const mongoUrl="mongodb+srv://mohamednoufal:admin@myapplication.sqix7zd.mongodb.net/?retryWrites=true&w=majority&appName=MyApplication";

mongoose.connect(mongoUrl)
.then(()=>{ console.log("mongodb connected ");
})
.catch((e)=>{
  console.log(e);
})

require('./models/usersDetails')
const User=mongoose.model("usersInfo");

const port =  6000 ;
app.listen(port, () => console.log(`Server running on port ${port}`));




 app.get('/',(req,res)=>{
  res.send({status:"Started"});
})

app.post("/usersRegister",async(req,res)=>{

  const {name, phone,password}=req.body;
    const userType="USER";
    console.log("user",req.body);
   const oldUser=await User.findOne({phone:phone});

  if(oldUser){
    return res.send({status: "exists",data:"User already exists"});
  }

  const encrypt=await bcrypt.hash(password,10);

  try{
    await User.create({
      name:name,
      phone:phone,
      password:encrypt,
      userType:userType
    });
    console.log("User Created");
    res.send({status:"ok",data:"User Created"});

  }catch(error){
    res.send({status:"error",data:error});

  }
})



app.post("/login-user", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user by phone or email (here assuming phone is used as email)
    const oldUser = await User.findOne({ phone: email });

    if (!oldUser) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    // Check if password is correct
    const isPasswordValid = await bcrypt.compare(password, oldUser.password);
    if (!isPasswordValid) {
      return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { phone: oldUser.phone },
      JWT_SECRET,
      { expiresIn: '10min' }
    );

    // Respond with success
    return res.status(200).json({
      status: "ok",
      data: token,
      userType: oldUser.userType,
      user: oldUser
    });

  } catch (err) {
    // console.error("Login error:", err);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});
 


//  app.post("/login-user",async(req,res)=>{
//   const {email,password}=req.body;
  
//    const oldUser=await User.findOne({phone:email});
    

//   if(!oldUser){
//     return res.status(404).json({ status: 'error', data: 'User not found' });
//   }
//   console.log(oldUser);

//  if(await bcrypt.compare(password,oldUser.password)){
//   const token=jwt.sign({phone:oldUser.phone},JWT_SECRET,
//     { expiresIn: '10min' }
//   );
 
                //   const decoded = jwt.decode(token);
              // const exptime = decoded.exp * 1000; // Convert to milliseconds
              // console.log('Token Expiration Time (in ms):', exptime);
 
             // console.log(exptime);
 //res.send({status:"ok",data:"Logged in",data:token,userType:oldUser.userType,user:oldUser,username:oldUser.name});

 
               // if(res.status(201)){
   
                //   return res.send({ status:"ok",data:'token',userType:oldUser.userType,user:oldUser});
   
                  // } 
                 // else{
               //   return res.send({error:"error"});
                // }
//  }

 
// }) ;

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: Bearer <token>

  if (!token) return res.sendStatus(401); // Unauthorized

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      // return res.sendStatus(403); 
      res.status(403).json({ error: 'Forbidden',message:'Token Expired' }); // Forbidden (invalid/expired token)
    }// Forbidden (invalid/expired token)
    req.user = user;
    next();
  });
}

app.get('/verifyToken', authenticateToken, (req, res) => {
  res.json({ valid: true });
});
// Protected Route
app.get('/protected', authenticateToken, (req, res) => {
  const name = req.user.name; // Assuming the token contains user information
  res.json({ message: `Hello ${name}, you accessed protected data!` , valid: true });
});

// Start the server




app.post("/userData",async(req,res)=>{
  const {token}=req.body;
  
  
  try {
    const user=jwt.verify(token,JWT_SECRET);
    const userEmail=user.email;

    User.findOne({email:userEmail}).then((data)=>{
      console.log(data);
      return res.send({status:"ok",data:data});
    });
    
  } catch (error) {
    console.log(error);
    
  }
}); 




app.get("/Admins",async(req,res)=>{
 
  try {
   const data=await User.find({userType:"ADMIN"});
   console.log(data);
   res.json(data);
  
  } catch (error) {
  res.send(error);
    
  }
}); 


app.get("/Users",async(req,res)=>{
 
  try {
   const data=await User.find({userType:"USER"});
   console.log(data);
   res.json(data);
      
  } catch (error) {
  res.send(500).send(error);
    
  }
}); 


app.get("/Mosques",async(req,res)=>{
 
  try {
   const data=await Mosque.find();
   console.log(data);
   res.json(data);
      
  } catch (error) {
  res.send(500).send(error);
    
  }
}); 

app.get("/Mosques/:Email",async(req,res)=>{
 
  try {
    const {Email}=req.params;
   const data=await Mosque.find({Email:Email});
   console.log(data);
   res.json(data);
      
  } catch (error) {
  res.send(500).send(error);
    
  }
}); 

app.get('/selectedMosque', async (req, res) => {
  try {
    const { selection} = req.query;
    const data = await Mosque.findOne({ mosqueName: selection});
    res.json(data);
    console.log(data);
  } catch (error) {
    res.status(500).send(error);
  }
});

app.get('/selectedMosque/:email', async (req, res) => {
  try {
    const { email} = req.query;
    const data = await Mosque.findOne({Email:email});
    res.json(data);
    console.log(data);
  } catch (error) {
    res.status(500).send(error);
  }
});

app.delete('/Admins/:id', async (req, res) => {
  
  try {
    const {id} =req.params;
    console.log(id);

    const deletedItem=await User.findByIdAndDelete(id);
    if(!deletedItem){
      return res.status(404).json({msg:"User not found"});
    }
    console.log(deletedItem);
     res.status(200).send({message:'Item deleted successfully'});
  } 
  
  catch (error) {
    res.status(500).send({error:'an Error occured'});
  }

});

app.delete('/Users/:id', async (req, res) => {
  
  try {
    const {id} =req.params;
    console.log(id);

    const deletedItem=await User.findByIdAndDelete(id);
    if(!deletedItem){
      return res.status(404).json({msg:"User not found"});
    }
    console.log(deletedItem);
     res.status(200).send({message:'Item deleted successfully'});
  } 
  
  catch (error) {
    res.status(500).send({error:'an Error occured'});
  }
  
});

app.put('/Mosques/:id', async (req, res) => {
  
  try {
    const id = req.params.id;
    console.log(id);
    const {updatedData}=req.body;
     //const {fajrSalah,fajrIkaamat,zuhrSalah,zuhrIkaamat,asrSalah,asrIkaamat,maghribSalah,maghribIkaamat,ishaSalah,ishaIkaamat,jummahSalah,jummahikaamat}=req.body; 
    // console.log(fajrSalah,fajrIkaamat,zuhrSalah,zuhrIkaamat,asrSalah,asrIkaamat,maghribSalah,maghribIkaamat,ishaSalah,ishaIkaamat,jummahSalah,jummahikaamat);  
     // const updatedItem = await Mosque.findByIdAndUpdate(id, updatedData,{new:true});
     const updatedItem = await Mosque.findByIdAndUpdate(id, updatedData, { new: true });
   /*  const updatedItem=await Mosque.findByIdAndUpdate(id,
     
      fajrSalah,
      zuhrSalah,
      asrSalah,
      maghribSalah,
      ishaSalah,
      jummahSalah,
      fajrIkaamat,
      zuhrIkaamat,
      asrIkaamat,
      maghribIkaamat,
      ishaIkaamat,
      jummahikaamat); */
    if(!updatedItem){
      return res.status(404).json({msg:"Data not found"});
    }
    console.log(updatedItem);
     res.status(200).send({message:'Item Updated successfully'});
  } 
  
  catch (error) {
    res.status(500).send({error:'an Error occured'});
  }
  
});



// app.listen(port,(req,res)=>{
//   console.log("mongodb connected to port 5000");
// })



// const UpdatedMosqueInfo = require('./models/updatedData'); 

app.put('/updateMosque/:id', async (req, res) => {
  try {
    const { id } = req.params; // this will be used as the filter (_id)
    const mosqueData = req.body.mosqueData || {};
    const updatedData = req.body.updatedData || {};
    const userphone = mosqueData.userPhone || "system";

    // console.log("Mosque Data:", mosqueData);
    // console.log("Updated Data:", updatedData);
  
    // Add metadata fields
    // mosqueData.updatedAt = new Date().toLocaleString();
  
    console.log("Updated At:", mosqueData.updatedAt);
    mosqueData.updatedBy = userphone;
  
    // Merge updatedData with mosqueData
    const updatePayload = { ...updatedData, ...mosqueData };
    console.log("Mosque Data:", mosqueData);
    console.log("Update Payload:", updatedData);
    console.log("User Phone:", userphone);
    console.log("Final Update Payload:", updatePayload);
  
    const updatedMosque = await Mosque.findOneAndUpdate(
      { _id: id },
      updatePayload,
      { new: true, upsert: true } // return the updated document or create it
    );
  
  res.status(200).json(updatedMosque);
  } catch (err) {
    console.error("Upsert failed", err);
    res.status(500).json({ error: "Failed to update or create mosque" });
  }
  
});


app.put('/Users/:id', async (req, res) => {
  const { id } = req.params;
  const { userType } = req.body;
  try {
    const user = await User.findByIdAndUpdate(id, { userType }, { new: true });
    if (user) {
      res.status(200).json({ message: 'User role updated', user });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

//multer setup

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // folder to store images
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  }
});



// app.use('/uploads', express.static('uploads'));


require('./models/mosqueDetails')
// const upload = multer({ storage: storage }); // old version with local storage
const uploads=require('./storage'); //updated version with cloudinary
 const Mosque=mongoose.model("mosqueInfo");

//  app.post("/mosqueRegister", upload.single('image'), async (req, res) => {
//   try {
//     const {
//       mosqueName,
//       location,
 
//       fajrSalah,
//       fajrIkaamat,
//       zuhrSalah,
//       zuhrIkaamat,
//       asrSalah,
//       asrIkaamat,
//       maghribSalah,
//       maghribIkaamat,
//       ishaSalah,
//       ishaIkaamat,
//       jummahSalah,
//       jummahikaamat
//     } = req.body;

//     if (!mosqueName || !location ) {
//       return res.status(400).json({ status: "error", data: "Missing required fields" });
//     }

//     const existingMosque = await Mosque.findOne({ mosqueName });

//     if (existingMosque) {
//       return res.status(409).json({ status: "error", data: "Mosque already exists" });
//     }

//     const newMosque = await Mosque.create({
//       mosqueName,
//       location,
    
//       fajrSalah,
//       fajrIkaamat,
//       zuhrSalah,
//       zuhrIkaamat,
//       asrSalah,
//       asrIkaamat,
//       maghribSalah,
//       maghribIkaamat,
//       ishaSalah,
//       ishaIkaamat,
//       jummahSalah,
//       jummahikaamat,
//       image: req.file ? req.file.filename : null
//     });

//     res.status(201).json({ status: "ok", data: "Mosque Created", mosque: newMosque });
//     console.log(` fullUrl: ${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`);
//   } catch (error) {
//     console.error("Error registering mosque:", error);
//     res.status(500).json({ status: "error", data: "Internal Server Error" });
//   }
// })


app.post("/mosqueRegister", uploads.single('image'), async (req, res) => {
  // console.log("Request body:", req.body);
  try {
    const {
      mosqueName,
      location,
      fajrSalah,
      fajrIkaamat,
      zuhrSalah,
      zuhrIkaamat,
      asrSalah,
      asrIkaamat,
      maghribSalah,
      maghribIkaamat,
      ishaSalah,
      ishaIkaamat,
      jummahSalah,
      jummahikaamat
    } = req.body;

    if (!mosqueName || !location) {
      return res.status(400).json({ status: "error", data: "Missing required fields" });
    }

    const existingMosque = await Mosque.findOne({ mosqueName });

    if (existingMosque) {
      return res.status(409).json({ status: "error", data: "Mosque already exists" });
    }

    // const imageUrl = req.file ? req.file.path : null;
const imageUrl = req.file?.path || null;

    const newMosque = await Mosque.create({
      mosqueName,
      location,
      fajrSalah,
      fajrIkaamat,
      zuhrSalah,
      zuhrIkaamat,
      asrSalah,
      asrIkaamat,
      maghribSalah,
      maghribIkaamat,
      ishaSalah,
      ishaIkaamat,
      jummahSalah,
      jummahikaamat,
      image: imageUrl
    });

    res.status(201).json({ status: "ok", data: "Mosque Created", mosque: newMosque });
    console.log(`Image uploaded to: ${imageUrl}`);
  } catch (error) {
    console.error("Error registering mosque:", error);
    res.status(500).json({ status: "error", data: "Internal Server Error" });
  }
});



//Retrieve phone numbers suggestion


// GET /phone-history?search=9876
app.get('/phonehistory', async (req, res) => {
  const { search } = req.query;
  
  if (!search || search.length < 4) {
    return res.status(400).json({ error: 'Search string too short' });
  }

  try {
    const results = await User.find({
      phone: { $regex: `^${search}` } // prefix match
    }).limit(10);

    const numbers = results.map(p => p.phone);
    res.json({ data: numbers });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch suggestions' });
  }
});
