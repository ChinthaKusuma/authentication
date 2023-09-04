const express = require("express");
const app = express();
const bcrypt = require("bcrypt");
const { open } = require("sqlite");
const path = require("path");
const dbPath = path.join(__dirname, "userData.db");
const sqlite3 = require("sqlite3");
let db = null;
app.use(express.json());

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Started");
    });
  } catch (e) {
    console.log("DB Error");
    process.exit(1);
  }
};
initializeDbAndServer();
app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;

  const hashPassword = await bcrypt.hash(password, 10);
  const query = `select * from user where username='${username}';`;
  const dbResponse = await db.get(query);
  if (dbResponse === undefined) {
    const createUser = `insert into user(username,name,password,gender,location)
            values('${username}','${name}','${hashPassword}','${gender}','${location}');`;
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      await db.run(createUser);
      response.status(200);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const query2 = `select * from user where username='${username}';`;
  const dbResponse2 = await db.get(query2);

  if (dbResponse2 === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatch = await bcrypt.compare(
      password,
      dbResponse2.password
    );
    if (isPasswordMatch === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const hashNewPassword = await bcrypt.hash(newPassword, 10);
  const query3 = `select * from user where username='${username}';`;
  const dbResponse3 = await db.get(query3);
  if (dbResponse3 == undefined) {
    response.status(400);
    response.send("User not registered");
  } else {
    const isPasswordFalse = await bcrypt.compare(
      oldPassword,
      dbResponse3.password
    );

    if (isPasswordFalse === true) {
      if (newPassword.length < 5) {
        response.status(400);
        response.send("Password is too short");
      } else {
        const query4 = `update user set
                password='${hashNewPassword}'
                 where username='${username}';`;
        await db.run(query4);
        response.status(200);
        response.send("Password updated");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});
module.exports = app;
