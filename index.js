const express = require("express");
const app = express();
const dfff = require("dialogflow-fulfillment");
const nodemailer = require("nodemailer");
var admin = require("firebase-admin");

var serviceAccount = require("./project-firebase-70320-firebase-adminsdk-5xlst-54e1a329b6");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://project-firebase-70320-default-rtdb.firebaseio.com/",
});

app.get("/", (req, res) => {
  res.send("Live Server");
});

app.post("/", express.json(), (req, res) => {
  const agent = new dfff.WebhookClient({
    request: req,
    response: res,
  });
  console.log("req.body", JSON.stringify(req.body));

  const result = req.body.queryResult;

  function UserGetEmailHandler(agent) {
    const { mail } = result.parameters;
    agent.add(`I sent you at email at the address ${mail} you provided!`);

    var items;
    const userName = "";

    admin
      .auth()
      .getUserByEmail(mail)
      .then(function (userRecord) {
        // See the UserRecord reference doc for the contents of userRecord.
        console.log("Successfully fetched user data:", userRecord.uid);

        admin
          .database()
          .ref("/orders")
          .orderByChild("userId")
          .equalTo(userRecord.uid)
          .on("child_added", function (snapshot) {
            var price;
            items = snapshot.val().items;
            var text = "";
            price = snapshot.val().total;

            for (i = 0; i < items.length; i++) {
              text =
                text +
                ("Room " +
                  items[i].number +
                  " - " +
                  items[i].reservationDay +
                  " <br/>");
            }

            const output = `
            <h2>You paid a total of ${{ price }}$ </h2>
            <h2>Here is the list with the rooms you booked: </h2>
            <h3>${text}</h3>
            <h3>Thank you ${userName}</h3>
          `;

            try {
              const transporter = nodemailer.createTransport({
                service: "gmail",
                type: "SMTP",
                host: "smtp.gmail.com",
                port: 465,
                secure: true,
                auth: {
                  user: "rogerino121@gmail.com",
                  pass: "opwvhdsjaqyqzsbc",
                },
              });

              const mailOptions = {
                from: "rogerino121@gmail.com", // sender address
                to: mail, // list of receivers
                subject: "UserGetEmailMessage", // Subject line
                html: output,
              };

              transporter.sendMail(mailOptions, function (err) {
                if (err) {
                  console.log(error, "error in the sendMail method");
                } else {
                  console.log("email sent successfully");
                }
              });
            } catch (error) {
              console.log(error, "email not sent");
            }
          });
      })
      .catch(function (error) {
        agent.add(
          "The address you provided is not registered in the database!\n"
        );
      });
  }

  var intentMap = new Map();

  intentMap.set("UserGetEmail", UserGetEmailHandler);

  agent.handleRequest(intentMap);
});

app.listen(process.env.PORT || 3000, () =>
  console.log("Server is live at port 3000")
);
