import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const emailToken = process.env.EMAIL_AUTH;
const emailUrl = process.env.EMAIL_URL;
const redirectUrl = process.env.REDIRECT_URL;

if (!emailToken || !emailUrl || !redirectUrl) {
  throw console.error("Required env variables not found");
}

const sendEmail = async (userEmail: string) => {
  try {
    await axios.post(
      emailUrl + "/send",
      {
        user: "Notify",
        recipient: userEmail,
        url: redirectUrl,
      },
      { headers: { Authorization: "Bearer " + emailToken } }
    );
    return "ok";
  } catch (e) {
    console.log(e);
    return "error";
  }
};

const verifyEmail = async (token: string) => {
  try {
    await axios.post(
      emailUrl + "/verify",
      {
        user: "Notify",
        token,
      },
      { headers: { Authorization: "Bearer " + emailToken } }
    );
    return "ok";
  } catch (e) {
    console.log(e);
    return "error";
  }
};

const serviceEmail = async (token: string) => {
  try {
    await axios.post(emailUrl + "/service-status", {
      headers: { Authorization: "Bearer " + emailToken },
    });
    return "ok";
  } catch (e) {
    console.log(e);
    return "error";
  }
};

export { sendEmail, verifyEmail, serviceEmail };
