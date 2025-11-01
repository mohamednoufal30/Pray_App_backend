const mongoose=require('mongoose');



const UsersDetails=new mongoose.Schema({
  
    name:{type:String},
    phone:{type:String,unique:true},
    password:{type:String},
    userType:{type:String},
    MosqueName:{type:String},
    fcmToken:{type:String},
    notificationStatus:{type:Boolean},
    deviceId: { type: String, unique: true, sparse: true }
   
},{
    collection:"usersInfo"
});

mongoose.model("usersInfo",UsersDetails);