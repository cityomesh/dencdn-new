const nodemailer = require("nodemailer");

async function testSMTP() {
  const transporter = nodemailer.createTransport({
    host: "smtp.office365.com",
    port: 587,
    secure: false,
    auth: {
      user: "omesh@ulka.tv",
      pass: "your-real-password", // 👈 replace with correct password or app password
    },
  });

  try {
    await transporter.verify();
    console.log("✅ SMTP connection successful");
  } catch (err) {
    console.error("❌ SMTP connection failed:", err);
  }
}

testSMTP();
