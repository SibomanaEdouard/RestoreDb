import axios from "axios";
import { Recipient, SendPulseEmail } from "../interfaces/interfaces";

async function getEmailToken(): Promise<string> {
  try {
    const clientId: string = process.env.CLIENT_ID!;
    const clientSecret: string = process.env.CLIENT_SECRET!;
    const grant_type: string = process.env.GRANT_TYPE!;
    const responseToken: any = await axios.post(
      "https://api.sendpulse.com/oauth/access_token",
      {
        grant_type: grant_type,
        client_id: clientId,
        client_secret: clientSecret,
      }
    );
    return responseToken.data.access_token;
  } catch (e) {
    console.log(e);
    return "";
  }
}

async function sendEmailUsingSendPulse(
  recipients: Recipient[],
  subject: string,
  contents: string,
  templateId: string
): Promise<void> {
  try {
    const accessToken: string = await getEmailToken();

    const message: SendPulseEmail = {
      email: {
        subject: subject,
        from: {
          name: "DentoConnect",
          email: process.env.EMAIL_USERNAME!,
        },
        to: recipients,
        template: {
          id: templateId,
          variables: {
            username: recipients[0].name,
            passcode: contents,
          },
        },
      },
    };
    await axios.post("https://api.sendpulse.com/smtp/emails", message, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch (error: any) {
    console.error("Human:SendPulse API Error:", error.message);
  }
}

export { sendEmailUsingSendPulse, getEmailToken };
