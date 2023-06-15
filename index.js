const { google } = require("googleapis");
const readlineSync = require("readline-sync");
const dotenv = require("dotenv");

dotenv.config();

const run = async () => {
  try {
    // Create a new instance of the OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.CLIENT_ID,
      process.env.CLIENT_SECRET,
      process.env.REDIRECT_URI
    );

    // Generate the authentication URL
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline", //to request a refresh token along with the access token
      scope: ["https://mail.google.com/"],
      // prompt: "consent",
    });
    console.log("Please click on this link and Authorize the AUTO REPLY APP ", authUrl);

    // get the code from URL
    const code = readlineSync.question("Enter the authorization code from the URL: ");
    console.log("code : ", code);

    // exchange this code in order to get access token
    const getTokenResponse = await oauth2Client.getToken(code);
    const tokens = getTokenResponse.tokens;
    console.log("tokens after exchanging Authorization code : ", tokens);

    const wait = async () => {
      const random = Math.floor(Math.random() * (12000 - 4500) + 4500);
      console.log("waiting for", Math.floor(random / 1000), "sec");
      setTimeout(async () => {
        await repeat();
        wait();
      }, random);
    };
    wait();

    const repeat = async () => {
      try {
        // Set the credentials for the OAuth2 client
        oauth2Client.setCredentials(tokens);

        // Create a Gmail API client
        const gmail = google.gmail({ version: "v1", auth: oauth2Client });

        // GET THE USER PROFILE
        const profile = await gmail.users.getProfile({ userId: "me" });
        // console.log(profile.data);

        // getting unread emails uging this newly created gmail client
        const result = await gmail.users.messages.list({
          userId: "me",
          q: "is:unread",
        });
        // console.log(result.data.messages);

        if (result && result.data.messages) {
          const emails = result.data.messages;

          // get all the messages in this thread
          emails.map(async (email) => {
            let alreadyReplied = false;
            let user = "";
            const thread = await gmail.users.threads.get({
              userId: "me",
              id: email.threadId,
            });

            // iterating through all the messages in the current thread
            await Promise.all(
              thread.data.messages.map((message) => {
                // check in the header if there any field with name = from , value = current mail id
                message.payload.headers.forEach((obj) => {
                  if (obj.name === "From") {
                    let t = obj.value.split("<");
                    t = t[t.length - 1].split(">")[0];
                    if (t === profile.data.emailAddress) {
                      alreadyReplied = true;
                    } else {
                      user = t;
                    }
                  }
                });
              })
            );

            // send reply if not replied before
            if (!alreadyReplied) {
              console.log("Sending Reply to : ", email);
              const replyMessage = {
                from: profile.data.emailAddress,
                to: user,
                subject: "Vacation Auto-Reply",
                body: "Thank you for your email. I am currently on vacation and will respond to you as soon as possible",
              };
              // console.log(replyMessage);
              const rawMessage = [
                `From: ${replyMessage.from}`,
                `To: ${replyMessage.to}`,
                "Content-Type: text/html; charset=utf-8",
                "MIME-Version: 1.0",
                `Subject: ${replyMessage.subject}`,
                "",
                replyMessage.body,
              ]
                .join("\r\n")
                .trim();

              // sent the mail
              await gmail.users.messages.send({
                userId: profile.data.emailAddress,
                requestBody: {
                  raw: Buffer.from(rawMessage).toString("base64"),
                  threadId: email.threadId,
                },
              });
              console.log("Reply email sent successfully to", user);

              //   Create a label if not exists
              let labels = await gmail.users.labels.list({ userId: "me" });
              labels = labels.data.labels;

              // check lebel already exists or not
              let labelId = "";
              const checkExists = labels.some((label) => {
                if (label.name === "Vacation_auto_reply") {
                  labelId = label.id;
                  return true;
                }
              });

              //   if does not exist the create
              if (!checkExists) {
                const res = await gmail.users.labels.create({
                  userId: "me",
                  requestBody: {
                    name: "Vacation_auto_reply",
                    messageListVisibility: "show",
                    labelListVisibility: "labelShow",
                  },
                });
                labelId = res.data.id;
                // console.log(res);
                console.log("Label Created successfully.");
              } else {
                console.log("Label already exists.");
              }

              // Add a label to the email
              await gmail.users.threads.modify({
                userId: "me",
                id: email.threadId,
                requestBody: {
                  addLabelIds: [`${labelId}`],
                },
              });
              console.log("Label added to the email successfully.");
            }
          });
        }
      } catch (err) {
        console.log("----------ERROR--------", err);
      }
    };
  } catch (err) {
    console.log("---------------------Error---------------------------------- : ", err);
  }
};

run();