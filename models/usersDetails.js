const mongoose=require('mongoose');



const UsersDetails=new mongoose.Schema({
  
    name:{type:String},
    phone:{type:String,unique:true},
    password:{type:String},
    userType:{type:String}
   
   
},{
    collection:"usersInfo"
});

mongoose.model("usersInfo",UsersDetails);