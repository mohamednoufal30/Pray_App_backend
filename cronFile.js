const mongoose = require("mongoose");
const cron = require("node-cron");
const moment = require("moment");
const admin = require("./firebase");

require("./models/UsersDetails"); // make sure paths are correct
require("./models/MosqueDetails");

const User = mongoose.model("usersInfo");
const Mosque = mongoose.model("mosqueInfo");

// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/yourDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

cron.schedule("* * * * *", async () => {
  try {
    const now = moment().format("HH:mm");
    console.log("Checking prayer times at", now);

    const mosques = await Mosque.find({});
    for (const mosque of mosques) {
      const prayers = [
        { name: "Fajr", time: mosque.fajrSalah },
        { name: "Zuhr", time: mosque.zuhrSalah },
        { name: "Asr", time: mosque.asrSalah },
        { name: "Maghrib", time: mosque.maghribSalah },
        { name: "Isha", time: mosque.ishaSalah },
      ];

      for (const prayer of prayers) {
        // Calculate 10 min before prayer
        const prayerTimeMinus10 = moment(prayer.time, "HH:mm")
          .subtract(10, "minutes")
          .format("HH:mm");

        if (now === prayerTimeMinus10) {
          // Send notifications to all users of this mosque with notificationStatus true
          const users = await User.find({
            MosqueName: mosque.mosqueName,
            notificationStatus: true,
            fcmToken: { $exists: true, $ne: "" },
          });

          for (const user of users) {
            sendNotification(user.fcmToken, prayer.name);
          }
        }
      }
    }
  } catch (err) {
    console.error("Cron job error:", err);
  }
});

function sendNotification(token, prayerName) {
  const message = {
    token,
    notification: {
      title: "Prayer Reminder 🕌",
      body: `Your ${prayerName} prayer is in 10 minutes.`,
    },
  };

  admin
    .messaging()
    .send(message)
    .then(() => console.log(`✅ Notification sent for ${prayerName}`))
    .catch((err) => console.error("❌ Error sending notification:", err));
}
