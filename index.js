const express = require("express"); // load express module
const nedb = require("nedb-promises"); // load nedb module

const app = express(); // init app
const db = nedb.create("users.jsonl"); // init db

app.use(express.static("public")); // enable static routing to "./public" folder

const bcrypt = require("bcrypt"); //load bcrypt module
const jwt = require("jsonwebtoken"); //load json web token module
const { response } = require("express");

// automatically decode all requests from JSON and encode all responses into JSON
app.use(express.json());

MY_SECRET_KEY = "1612837107";

app.get("/users", (req, res) => {
  // GET all data
  db.find({})
    .then((docs) => res.send(docs))
    .catch((error) => res.send({ error }));
});

//Register
app.post("/users", (req, res) => {
  const { username, password, email, name } = req.body;
  if (username && password && email && name) {
    db.findOne({ username: username })
      .then((doc) => {
        if (doc) {
          res.json({ error: "Username already exists" });
        } else {
          const salt = bcrypt.genSaltSync();
          let hashedPassword = bcrypt.hashSync(req.body.password, salt);
          let authToken;

          authToken = jwt.sign({ username }, MY_SECRET_KEY);

          const user = {
            ...req.body,
            password: hashedPassword,
            authToken: authToken,
            todos: [],
          };
          db.insertOne(user) // insert new doc into db
            .then((doc) => {
              delete doc.password, res.send(doc);
            })
            .catch((error) => res.json({ error }));
        }
      })
      .catch((error) => res.json({ error: "Something went wrong" }));
  } else {
    res.send({ error: "Missing Required Fields" });
  }
});

//Login
app.post("/users/auth", (req, res) => {
  const { username, password } = req.body;
  db.findOne({ username: username }) // find matching doc
    .then(async (doc) => {
      if (doc) {
        if (bcrypt.compareSync(password, doc.password)) {
          //authenticate password
          doc.authToken = jwt.sign({ username }, MY_SECRET_KEY);
          //update the authentication token
          db.updateOne({ username }, { $set: { authToken: doc.authToken } });
          delete doc.password;
          res.send(doc);
        } else {
          res.send("Username and password didn't match");
        }
      } else {
        res.send({ error: "Username not found" });
      }
    })
    .catch((error) => res.send({ error }));
});

//add todo button
app.post("/users/:authToken/todos", (req, res) => {
  const { authToken } = req.params;
  const data = req.body;
  db.findOne({ authToken }).then((doc) => {
    let todos = (doc && doc.todos) != null ? doc && doc.todos.slice() : [];
    todos.push({ title: data.data, isCompleted: false, id: todos.length });
    db.update({ authToken }, { $set: { todos } }, { upsert: true })
      .then((_) => res.send(true))
      .catch((_) => res.send(false));
  });
});

//add todo button
app.get("/users/:authToken/todos", (req, res) => {
  const { authToken } = req.params;
  db.findOne({ authToken }).then((doc) => {
    if (doc && doc.todos) {
      res.json({ todos: doc.todos });
    } else {
      res.json({ todos: [] });
    }
  });
});

//update todos
app.patch("/users/:authToken/todos", async (req, res) => {
  const { authToken } = req.params;
  const { selectedTodos } = req.body;

  const doc = await db.findOne({ authToken });
  const todos = doc.todos;

  todos.forEach((todo) => {
    if (selectedTodos.indexOf(todo.id) != -1) {
      todos[todo.id].isCompleted = true;
    } else {
      todos[todo.id].isCompleted = false;
    }
  });

  db.update({ authToken }, { $set: { todos } }, { upsert: true })
    .then((_) => res.send(true))
    .catch((_) => res.send(false));
});

//delete profile
app.delete("/users//:authenticationToken", (req, res) => {
  const { authenticationToken } = req.params;
  db.deleteOne({ authToken: authenticationToken })
    .then((result) => {
      if (result) {
        res.send({
          message: "User profile deleted successfully.",
        });
      } else {
        res.send({ error: "Something went wrong" });
      }
    })
    .catch((error) => res.send({ error }));
});

//delete authtoken when logged out
app.delete("/auth/:authToken", (req, res) => {
  const { username, authToken } = req.params;

  db.updateOne({ username, authToken }, { $set: { authToken: null } })
    .catch((error) => res.send({ error }))
    .then((doc) => res.send({ ok: true }));
});

// default route
app.all("*", (req, res) => {
  res.status(404).send({ error: "Invalid URL." });
});

// start server
app.listen(3000, () => console.log("Server started on http://localhost:3000"));
