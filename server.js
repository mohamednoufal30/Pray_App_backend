const express = require('express');
/*  const bodyParser=require('body-parser');  */
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

const JWT_SECRET='SECRET123';

const port=5000;


const mongoUrl="mongodb+srv://mohamednoufal:admin@myapplication.sqix7zd.mongodb.net/?retryWrites=true&w=majority&appName=MyApplication";
mongoose.connect(mongoUrl)
.then(()=>{ console.log("mongodb connected ");
})
.catch((e)=>{
  console.log(e);
})

require('./models/usersDetails')
const User=mongoose.model("usersInfo");



 app.get('/',(req,res)=>{
  res.send({status:"Started"});
})

app.post("/usersRegister",async(req,res)=>{
  const {name,email,phone,password,userType}=req.body;
  
   const oldUser=await User.findOne({email:email});

  if(oldUser){
    return res.send({data:"User already exists"});
  }

  const encrypt=await bcrypt.hash(password,10);

  try{
    await User.create({
      name:name,
      email:email,
      phone:phone,
      password:encrypt,
      userType:userType
    });
    res.send({status:"ok",data:"User Created"});

  }catch(error){
    res.send({status:"error",data:error});

  }
})
 


 app.post("/login-user",async(req,res)=>{
  const {email,password}=req.body;
  
   const oldUser=await User.findOne({email:email});


  if(!oldUser){
    return res.send({data:"user doesn't exists"});
  }
  console.log(oldUser);

 if(await bcrypt.compare(password,oldUser.password)){
  const token=jwt.sign({email:oldUser.email},JWT_SECRET);

 //res.send({status:"ok",data:"Logged in",token:token});

 
   
  if(res.status(201)){
   
    return res.send({ status:"ok",data:'token',userType:oldUser.userType,user:oldUser});
   
  } else{
    return res.send({error:"error"});
  }
 }

 
}) ;

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




require('./models/mosqueDetails')
 const Mosque=mongoose.model("mosqueInfo");

 app.post("/mosqueRegister",async(req,res)=>{
  const { mosqueName,location,email,userType,fajrTime,fajrIkaamat,zuhrTime,zuhrIkaamat,asrTime,asrIkaamat,magribTime,magribIkaamat,
       ishaTime,ishaIkaamat,jummaTime,jummahikaamat}=req.body;
  
   const oldMosque=await Mosque.findOne({mosqueName:mosqueName});

  if(oldMosque){
    return res.send({data:"User already exists"});
  }


  try{
    await Mosque.create({
    mosqueName:mosqueName,
    location:location,
    Email:email,
    userType:userType,
    fajrSalah:fajrTime,
    zuhrSalah:zuhrTime,
    asrSalah:asrTime,
    maghribSalah:magribTime,
    ishaSalah:ishaTime,
    jummahSalah:jummaTime,
    fajrIkaamat:fajrIkaamat,
    zuhrIkaamat:zuhrIkaamat,
    asrIkaamat:asrIkaamat,
    maghribIkaamat:magribIkaamat,
    ishaIkaamat:ishaIkaamat,
    jummahikaamat:jummahikaamat
    });
    res.send({status:"ok",data:"Mosque Created"});

  }catch(error){
    res.send({status:"error",data:error});

  }
}) 


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



app.listen(port,(req,res)=>{
  console.log("mongodb connected to port 5000");
})

