const mongoose=require('mongoose');




const UsersDetails=new mongoose.Schema({
  
    name:{type:String},
    email:{type:String,unique:true},
    phone:{type:String},
    password:{type:String},
    userType:{type:String}
   
   
},{
    collection:"usersInfo"
});

mongoose.model("usersInfo",UsersDetails);