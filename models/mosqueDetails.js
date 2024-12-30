const { Timestamp } = require('mongodb');
const mongoose=require('mongoose');
const Schema = mongoose.Schema;


const mosqueDetails=new Schema({
  
    mosqueName:{type:String,unique:true},
    location:{type:String},
    Email:{type:String} ,
    userType:{type:String},
    fajrSalah:{type:String},    
    zuhrSalah:{type:String},
    asrSalah:{type:String},
    maghribSalah:{type:String},
    ishaSalah:{type:String},
    jummahSalah:{type:String},
    fajrIkaamat:{type:String},
    zuhrIkaamat:{type:String},
    asrIkaamat:{type:String},
    maghribIkaamat:{type:String},
    ishaIkaamat:{type:String},
    jummahikaamat:{type:String},
    createdAt:{type:Date,default:Date.now},
    updatedAt:{type:Date,default:Date.now}
      
},{
    collection:"mosqueInfo"
});
mongoose.model("mosqueInfo",mosqueDetails);