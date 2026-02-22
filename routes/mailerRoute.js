const nodemailer = require("nodemailer");
// const pwd = "wvup kioa vomb xkmv"

const sentOTP = async (email, otp) => {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: "devnfl30@gmail.com",
            pass: "wvup kioa vomb xkmv"
        }
    })

    const mailOptions = {
        from: "devnfl30@gmail.com",
        to: email,
        subject: "OTP Verification",
        text: `Your OTP is ${otp}`
    }

    await transporter.sendMail(mailOptions);

}


const verifyOTP = async (req, res) => {

    const { email, otp } = req.body;
    if (!email || !otp) {
        return res.status(400).json({ message: "Email and OTP are required" })
    }

    if (parseInt(otp) == otp) {
        return res.status(200).json({ message: "OTP verified successfully" })
    } else {
        return res.status(400).json({ message: "Invalid OTP" })
    }


}


module.exports = { sentOTP, verifyOTP };