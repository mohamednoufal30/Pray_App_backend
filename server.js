const express = require('express');
require('dotenv').config();

/*  const bodyParser=require('body-parser');  */
const multer = require('multer');
const path = require('path');
const app = express();
const axios = require('axios');
const mongoose = require('mongoose');
app.use(express.json());
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const cron = require('node-cron');
var admin = require("firebase-admin");
const nodemailer = require('nodemailer');
const { sentOTP, verifyOTP } = require('./routes/mailerRoute');


const { default: AsyncStorage } = require('@react-native-async-storage/async-storage');
const cors = require('cors');
// const { ObjectId } = require('bson');
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

const { ObjectId } = mongoose.Types;

require('./models/tokenDetails')
const Token = mongoose.model("Token");

// const JWT_SECRET = 'SECRET123';
const JWT_SECRET = process.env.JWT_SECRET;

// var serviceAccount = require("./Private/serviceAccountKey.json");
// console.log("serviceAccount", process.env.SERVICE_ACCOUNT_KEY);

const serviceAccount = JSON.parse(
  Buffer.from(process.env.SERVICE_ACCOUNT_KEY, 'base64').toString('utf8')
);


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

console.log("✅ Firebase Admin initialized successfully");

const mongoUrl = "mongodb+srv://mohamednoufal:admin@myapplication.sqix7zd.mongodb.net/?retryWrites=true&w=majority&appName=MyApplication";

// const mongoUrl = "mongodb://127.0.0.1:27017/test";
mongoose.connect(mongoUrl)
  .then(async () => {
    console.log("✅ MongoDB connected");

    // Example query after DB connection
    const count = await User.countDocuments({});
    console.log("Existing users:", count);
    // const PORT = 9090;
    const PORT = process.env.PORT;
    // Start server
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
    });
  });




cron.schedule("* * * * *", async () => {
  try {
    const now = new Date();
    const currentTime = new Date().toLocaleTimeString("en-IN", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Kolkata"
    });

    console.log("Checking notifications for:", currentTime);

    await sendPrayerNotifications(currentTime);

    const mosques = await Mosque.find({
      $or: [
        { fajrSalah: currentTime },
        { zuhrSalah: currentTime },
        { asrSalah: currentTime },
        { maghribSalah: currentTime },
        { ishaSalah: currentTime },
        { jummahSalah: currentTime },
        { fajrIkaamat: currentTime },
        { zuhrIkaamat: currentTime },
        { asrIkaamat: currentTime },
        { maghribIkaamat: currentTime },
        { ishaIkaamat: currentTime }
      ]
    });

    console.log("Mosques to notify:", mosques.length, mosques.map(m => m.mosqueName));

  } catch (err) {
    console.error("Error sending notifications:", err);
  }
});


async function sendPrayerNotifications(currentTime) {
  console.log("Checking notifications for:", currentTime);

  try {
    const mosques = await Mosque.find();
    const mosquesToNotify = mosques.filter(m =>
      [
        m.fajrIkaamat?.slice(0, 5),
        m.zuhrIkaamat?.slice(0, 5),
        m.asrIkaamat?.slice(0, 5),
        m.maghribIkaamat?.slice(0, 5),
        m.ishaIkaamat?.slice(0, 5)
      ].includes(currentTime)
    );

    console.log("Mosques to notify:", mosquesToNotify);

    if (mosquesToNotify.length === 0) return;

    for (const mosque of mosquesToNotify) {
      const salahName =
        mosque.fajrIkaamat?.slice(0, 5) === currentTime ? "Fajr" :
          mosque.zuhrIkaamat?.slice(0, 5) === currentTime ? "Zuhr" :
            mosque.asrIkaamat?.slice(0, 5) === currentTime ? "Asr" :
              mosque.maghribIkaamat?.slice(0, 5) === currentTime ? "Maghrib" :
                mosque.ishaIkaamat?.slice(0, 5) === currentTime ? "Isha" : null;

      const users = await User.find({
        MosqueName: mosque.mosqueName,
        notificationStatus: true,
        fcmToken: { $ne: "" }
      }).select("fcmToken");

      console.log("Users to notify:", users);

      const tokens = users.map(u => u.fcmToken);
      if (tokens.length === 0) continue;

      const message = {
        notification: {
          title: "Prayer Reminder",
          body: `It's time for your ${salahName} prayer at ${mosque.mosqueName}`
        },
        android: {
          notification: {
            channelId: "prayer-reminder",
            priority: "high"
          }
        },
        data: {
          salahName,
          mosqueName: mosque.mosqueName,
          type: "PRAYER_ALERT"
        },
        tokens
      };

      const response = await admin.messaging().sendEachForMulticast(message);

      response.responses.forEach((resp, index) => {
        if (!resp.success) {
          console.log("❌ Failed token:", tokens[index]);
          console.log("❌ Error code:", resp.error?.code);
          console.log("❌ Error message:", resp.error?.message);
          console.log("❌ Full error:", resp.error);
        }
      });
      console.log(`✅ Push sent to ${mosque.mosqueName}: ${response.successCount} success, ${response.failureCount} failed`);
    }

  } catch (error) {
    console.error("❌ Error sending notifications:", error);
  }
}



let lastSentTime = null;

// cron.schedule("* * * * *", async () => {
//   try {
//     const currentTime = new Date().toLocaleTimeString("en-IN", {
//       hour12: false,
//       hour: "2-digit",
//       minute: "2-digit",
//       timeZone: "Asia/Kolkata"
//     });

//     // 🔒 Prevent duplicate execution in same minute
//     if (lastSentTime === currentTime) {
//       return;
//     }

//     lastSentTime = currentTime;

//     console.log("Checking notifications for:", currentTime);

//     await sendPrayerNotifications(currentTime);

//   } catch (err) {
//     console.error("Error in cron job:", err);
//   }
// });

// async function sendPrayerNotifications(currentTime) {
//   try {

//     // Fetch only mosques matching current time
//     const mosques = await Mosque.find({
//       $or: [
//         { fajrIkaamat: { $regex: `^${currentTime}` } },
//         { zuhrIkaamat: { $regex: `^${currentTime}` } },
//         { asrIkaamat: { $regex: `^${currentTime}` } },
//         { maghribIkaamat: { $regex: `^${currentTime}` } },
//         { ishaIkaamat: { $regex: `^${currentTime}` } }
//       ]
//     });

//     if (!mosques.length) return;

//     for (const mosque of mosques) {

//       // Determine salah name
//       const salahName =
//         mosque.fajrIkaamat?.slice(0, 5) === currentTime ? "Fajr" :
//           mosque.zuhrIkaamat?.slice(0, 5) === currentTime ? "Zuhr" :
//             mosque.asrIkaamat?.slice(0, 5) === currentTime ? "Asr" :
//               mosque.maghribIkaamat?.slice(0, 5) === currentTime ? "Maghrib" :
//                 mosque.ishaIkaamat?.slice(0, 5) === currentTime ? "Isha" : null;

//       if (!salahName) continue;

//       // Fetch users for this mosque
//       const users = await User.find({
//         MosqueName: mosque.mosqueName,
//         notificationStatus: true,
//         fcmToken: { $exists: true, $ne: "" }
//       }).select("fcmToken");

//       const tokens = users.map(u => u.fcmToken);

//       if (!tokens.length) continue;

//       // Firebase allows max 500 tokens per request
//       const chunkSize = 500;

//       for (let i = 0; i < tokens.length; i += chunkSize) {
//         const chunk = tokens.slice(i, i + chunkSize);

//         const message = {
//           notification: {
//             title: "Prayer Reminder",
//             body: `It's time for ${salahName} prayer at ${mosque.mosqueName}`,
//             imageUrl: mosque.image
//           },
//           android: {
//             notification: {
//               channelId: "prayer-reminder",
//               imageUrl: mosque.image
//             }
//           },
//           data: {
//             salahName,
//             mosqueName: mosque.mosqueName,
//             type: "PRAYER_ALERT",
//             imageUrl: mosque.image || ""
//           },
//           tokens: chunk
//         };

//         const response = await admin
//           .messaging()
//           .sendEachForMulticast(message);

//         console.log("response", response);

//         console.log(
//           `✅ ${mosque.mosqueName} - ${salahName}: ${response.successCount} success, ${response.failureCount} failed`
//         );

//         // Optional: Remove invalid tokens
//         for (let i = 0; i < response.responses.length; i++) {
//           if (!response.responses[i].success) {
//             const invalidToken = chunk[i];

//             await User.updateOne(
//               { fcmToken: invalidToken },
//               { $unset: { fcmToken: "" } } // better than setting ""
//             );
//           }
//         }
//       }
//     }

//   } catch (error) {
//     console.error("❌ Error sending notifications:", error);
//   }
// }


app.get("/getUser", async (req, res) => {
  try {
    // Get users with notification ON
    const users = await User.find({ notificationStatus: true })
      .select(["MosqueName", "notificationStatus", "_id", "name"]);

    res.status(200).json(users);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error retrieving Users", error });
  }
});



app.post("/postToken", async (req, res) => {
  try {
    const { token } = req.body;  // <-- must match frontend key
    console.log("Received token:", token);

    if (!token) {
      return res.status(400).json({ success: false, message: "FCM token is required" });
    }

    const newToken = new Token({ token: token });
    await newToken.save();
    res.json({ success: true, message: "Token saved successfully" });
  } catch (error) {
    console.error("Error saving token:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});



app.post("/findToken", async (req, res) => {
  const { phone } = req.body;
  console.log("Finding token for phone:", phone);
  try {
    const token = await Token.find({ phone: phone });
    if (!token) {
      return res.status(404).json({ success: false, message: "Token not found" });
    }
    res.json({ success: true, data: token });
  } catch (error) {
    console.error("Error finding token:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


// update fcm token by object id

app.put("/updateToken", async (req, res) => {
  try {
    // Get ID from URL

    const { _id, fcmToken } = req.body;

    const updatedUser = await User.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(_id) },
      { $set: { fcmToken } }, // Data to update
      { new: true, runValidators: true } // Return updated doc & validate
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    console.log("Updated user:", updatedUser);
    res.json({ success: true, data: updatedUser });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});


// update Notification Status by object id
app.put("/updateNotificationStatus", async (req, res) => {
  try {
    const { _id, notificationStatus, MosqueName } = req.body;

    const updatedUser = await User.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(_id) },
      { $set: { notificationStatus, MosqueName } }, // Data to update
      { new: true, runValidators: true } // Return updated doc & validate
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, data: updatedUser });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});


require('./models/usersDetails')

const User = mongoose.model("usersInfo");






app.get('/', (req, res) => {
  res.send({ status: "Started" });
})

app.post("/usersRegister", async (req, res) => {

  const { name, phone, password, fcmToken, email } = req.body;
  const userType = "USER";
  console.log("user", req.body);
  const oldUser = await User.findOne({ phone: phone });

  if (oldUser) {
    return res.send({ status: "exists", data: "User already exists" });
  }

  const encrypt = await bcrypt.hash(password, 10);
  mosqueName = "";
  notificationStatus = false;

  try {
    await User.create({
      name: name,
      phone: phone,
      email: email,
      password: encrypt,
      userType: userType,
      fcmToken: fcmToken,
      notificationStatus: notificationStatus,
      MosqueName: mosqueName
    });
    console.log("User Created");
    res.send({ status: "ok", data: "User Created" });

  } catch (error) {
    res.send({ status: "error", data: error });

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
      // { expiresIn: '7d' }
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



function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: Bearer <token>

  if (!token) return res.sendStatus(401); // Unauthorized

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      // return res.sendStatus(403); 
      res.status(403).json({ error: 'Forbidden', message: 'Token Expired' }); // Forbidden (invalid/expired token)
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
  res.json({ message: `Hello ${name}, you accessed protected data!`, valid: true });
});

// Start the server




app.post("/userData", async (req, res) => {
  const { token } = req.body;


  try {
    const user = jwt.verify(token, JWT_SECRET);
    const userEmail = user.email;

    User.findOne({ email: userEmail }).then((data) => {
      // console.log(data);
      return res.send({ status: "ok", data: data });
    });

  } catch (error) {
    console.log(error);

  }
});

app.post("/postUserMosque", async (req, res) => {
  const { mosqueName, notificationStatus, userPhone } = req.body;

  try {
    // Update user
    const updatedUser = await User.findOneAndUpdate(
      { phone: userPhone },
      { $set: { MosqueName: mosqueName, notificationStatus: notificationStatus } },
      { new: true } // return the updated document
    );

    if (!updatedUser) {
      return res.status(404).send({ status: "error", message: "User not found" });
    }

    console.log("Updated user:", updatedUser);
    return res.send({ status: "ok", data: updatedUser });

  } catch (error) {
    console.error("Error updating user:", error);
    return res.status(500).send({ status: "error", message: "Server error" });
  }
});




app.get("/Admins", async (req, res) => {

  try {
    const data = await User.find({ userType: "ADMIN" });
    console.log(data);
    res.json(data);

  } catch (error) {
    res.send(error);

  }
});


app.get("/Users", async (req, res) => {

  try {
    const data = await User.find({ userType: "USER" });
    console.log(data);
    res.json(data);

  } catch (error) {
    res.send(500).send(error);

  }
});


app.get("/Mosques", async (req, res) => {

  try {
    const data = await Mosque.find();
    console.log(data);
    res.json(data);

  } catch (error) {
    res.send(500).send(error);

  }
});

app.get("/Mosques/:Email", async (req, res) => {

  try {
    const { Email } = req.params;
    const data = await Mosque.find({ Email: Email });
    console.log(data);
    res.json(data);

  } catch (error) {
    res.send(500).send(error);

  }
});

app.get('/selectedMosque', async (req, res) => {
  try {
    const { selection } = req.query;
    const data = await Mosque.findOne({ mosqueName: selection });
    res.json(data);
    console.log(data);
  } catch (error) {
    res.status(500).send(error);
  }
});

app.get('/selectedMosque/:email', async (req, res) => {
  try {
    const { email } = req.query;
    const data = await Mosque.findOne({ Email: email });
    res.json(data);
    console.log(data);
  } catch (error) {
    res.status(500).send(error);
  }
});

app.delete('/Admins/:id', async (req, res) => {

  try {
    const { id } = req.params;
    console.log(id);

    const deletedItem = await User.findByIdAndDelete(id);
    if (!deletedItem) {
      return res.status(404).json({ msg: "User not found" });
    }
    console.log(deletedItem);
    res.status(200).send({ message: 'Item deleted successfully' });
  }

  catch (error) {
    res.status(500).send({ error: 'an Error occured' });
  }

});

app.delete('/Users/:id', async (req, res) => {

  try {
    const { id } = req.params;
    console.log(id);

    const deletedItem = await User.findByIdAndDelete(id);
    if (!deletedItem) {
      return res.status(404).json({ msg: "User not found" });
    }
    console.log(deletedItem);
    res.status(200).send({ message: 'Item deleted successfully' });
  }

  catch (error) {
    res.status(500).send({ error: 'an Error occured' });
  }

});

app.put('/Mosques/:id', async (req, res) => {

  try {
    const id = req.params.id;
    console.log(id);
    const { updatedData } = req.body;
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
    if (!updatedItem) {
      return res.status(404).json({ msg: "Data not found" });
    }
    console.log(updatedItem);
    res.status(200).send({ message: 'Item Updated successfully' });
  }

  catch (error) {
    res.status(500).send({ error: 'an Error occured' });
  }

});




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
const uploads = require('./storage'); //updated version with cloudinary
const Mosque = mongoose.model("mosqueInfo");

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

let otpStore = {};


// app.post("/sendOTP", async (req, res) => {

//   try {
//     const { email } = req.body;
//     // const user = await User.findOne({ email });

//     // if (email != user?.email) {
//     //   console.log("Invalid email");
//     //   return res.status(400).json({ message: "Invalid email" });
//     // }

//     const otp = Math.floor(100000 + Math.random() * 900000);

//     otpStore[email] = {
//       otp,
//       expiresAt: Date.now() + 5 * 60 * 1000
//     };

//     await sentOTP(email, otp);

//     res.status(200).json({ message: "OTP sent successfully" });

//   } catch (error) {
//     res.status(500).json({ message: "Failed to send OTP" });
//   }
// });


// app.post("/verifyOTP", async (req, res) => {
//   try {
//     const { email, otp } = req.body;

//     if (!email || !otp) {
//       return res.status(400).json({ message: "Email and OTP are required" });
//     }

//     if (parseInt(otp) == otpStore[email].otp) {
//       return res.status(200).json({ message: "OTP verified successfully" });
//     } else {
//       return res.status(400).json({ message: "Invalid OTP" });
//     }

//   } catch (error) {
//     res.status(500).json({ message: "Failed to verify OTP" });
//   }
// });



app.post("/sendOTP", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    otpStore[email] = {
      otp: otp,  // store as STRING (important)
      expiresAt: Date.now() + 5 * 60 * 1000
    };

    console.log("Generated OTP:", otp); // 🔥 debug

    await sentOTP(email, otp);

    return res.status(200).json({
      message: "OTP sent successfully"
    });

  } catch (error) {
    console.log("SEND OTP ERROR:", error);
    return res.status(500).json({
      message: "Failed to send OTP"
    });
  }
});



/* ============================= */
/*        VERIFY OTP API         */
/* ============================= */
app.post("/verifyOTP", async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        message: "Email and OTP are required"
      });
    }

    const storedOTP = otpStore[email];

    if (!storedOTP) {
      return res.status(400).json({
        message: "OTP not found or expired"
      });
    }

    if (Date.now() > storedOTP.expiresAt) {
      delete otpStore[email];
      return res.status(400).json({
        message: "OTP expired"
      });
    }

    if (otp.toString() === storedOTP.otp) {
      delete otpStore[email];

      return res.status(200).json({
        message: "OTP verified successfully"
      });
    }

    return res.status(400).json({
      message: "Invalid OTP"
    });

  } catch (error) {
    console.log("VERIFY OTP ERROR:", error);
    return res.status(500).json({
      message: "Failed to verify OTP"
    });
  }
});


app.patch("/updatePin", async (req, res) => {
  try {
    const { resetPin, email } = req.body;

    if (!resetPin || !email) {
      return res.status(400).json({ status: "error", message: "Email and PIN required" });
    }

    // Hash the new PIN
    const hashPin = await bcrypt.hash(resetPin, 10);
    console.log("hashPin:", hashPin);

    // Update user password
    const updatedUser = await User.findOneAndUpdate(
      { email },
      { password: hashPin },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ status: "error", message: "User not found" });
    }

    console.log("Updated User:", updatedUser);

    res.status(200).json({
      status: "ok",
      message: "PIN updated successfully",
    });

  } catch (error) {
    console.error("Error updating PIN:", error);
    res.status(500).json({ status: "error", message: "Internal Server Error" });
  }
});