const express = require("express");
const otplib = require("otplib");
const QRCode = require("qrcode");
const path = require("path");

const app = express();
const port = 3000;

// Middleware to parse URL-encoded bodies and JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve static files (CSS, JS)
app.use(express.static(path.join(__dirname, "public")));

// Store secrets for sessions (in a production app, use proper session management)
let sessionSecret = null;
let sessionAccountName = null;

// Render the main page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Handle account name submission
app.post("/set-account", (req, res) => {
  const { accountName } = req.body;

  if (!accountName) {
    return res.status(400).send("Account name is required.");
  }

  // Generate a new TOTP secret
  sessionSecret = otplib.authenticator.generateSecret();
  sessionAccountName = accountName;

  // Generate otpauth URL
  const issuer = "2Auth-JS";
  const otpauth = otplib.authenticator.keyuri(
    sessionAccountName,
    issuer,
    sessionSecret
  );

  // Generate QR Code
  QRCode.toDataURL(otpauth, (err, imageUrl) => {
    if (err) {
      console.error("Error generating QR code", err);
      return res.status(500).send("Error generating QR code.");
    }

    res.json({ imageUrl });
  });
});

// Handle OTP verification
app.post("/verify", (req, res) => {
  const { token } = req.body;

  if (!token || !sessionSecret) {
    return res.status(400).send("Invalid request.");
  }

  const isValid = otplib.authenticator.check(token, sessionSecret);

  res.json({ isValid });
});

// Start the server
app.listen(port, () => {
  console.clear();

  console.log(`
  ------------------------------------------------------------

   \x1b[36m█████╗ ██╗   ██╗████████╗██╗  ██╗     ██╗███████╗\x1b[0m
  \x1b[36m██╔══██╗██║   ██║╚══██╔══╝██║  ██║     ██║██╔════╝\x1b[0m
  \x1b[36m███████║██║   ██║   ██║   ███████║     ██║███████╗\x1b[0m
  \x1b[36m██╔══██║██║   ██║   ██║   ██╔══██║██   ██║╚════██║\x1b[0m
  \x1b[36m██║  ██║╚██████╔╝   ██║   ██║  ██║╚█████╔╝███████║\x1b[0m
  \x1b[36m╚═╝  ╚═╝ ╚═════╝    ╚═╝   ╚═╝  ╚═╝ ╚════╝ ╚══════╝\x1b[0m
  
  🔒  \x1b[32mWelcome to AUTH js\x1b[0m  🔒
  
  \x1b[33mA Secure Two-Factor Authentication System\x1b[0m
  
  Designed by: \x1b[35mAmirhossein Dehghanazar\x1b[0m
  GitHub Repo: \x1b[34mhttps://github.com/AmirhosseinDehghanazar/2Auth-JS\x1b[0m


  ------------------------------------------------------------
  
  🔐  \x1b[31mSecure. Scalable. Easy to Use.\x1b[0m  🔐
  
  ------------------------------------------------------------
  `);
});
