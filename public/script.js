"use strict";

const $ = document.querySelector.bind(document);
let allTodos = null;

// login link action
$("#loginLink").addEventListener("click", openLoginScreen);

// register link action
$("#registerLink").addEventListener("click", openRegisterScreen);

// logout link action
$("#logoutLink").addEventListener("click", () => {
  fetch(`/auth/${localStorage.token}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  })
    .then((r) => r.json())
    .then((doc) => {
      openLoginScreen();
      window.location.reload();
    })
    .catch((err) => showError("ERROR: " + err));
});

// Register button action
$("#registerBtn").addEventListener("click", () => {
  // check to make sure no fields aren't blank
  if (
    !$("#registerUsername").value ||
    !$("#registerPassword").value ||
    !$("#registerName").value ||
    !$("#registerEmail").value
  ) {
    showError("All fields are required.");
    return;
  }
  var data = {
    username: $("#registerUsername").value,
    password: $("#registerPassword").value,
    name: $("#registerName").value,
    email: $("#registerEmail").value,
  };
  // TODO:
  //   POST /users
  //     convert data (defined above) to json, and send via POST to /users
  //     decode response from json to object called doc
  //     if doc.error, showError(doc.error)
  //     otherwise, openHomeScreen(doc)
  //   use .catch(err=>showError('ERROR: '+err)}) to show any other errors
  fetch("/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
    .then((r) => r.json())
    .then((doc) => {
      if (doc.error) {
        showError(doc.error);
        return;
      }
      if (doc.authToken) {
        localStorage.setItem("token", doc.authToken);
      }
      openHomeScreen(doc);
    })
    .catch((err) => showError("ERROR: " + err));
});

// Sign In button action
$("#loginBtn").addEventListener("click", () => {
  // check to make sure username/password aren't blank
  if (!$("#loginUsername").value || !$("#loginPassword").value) return;
  // TODO:
  //   GET /users/{username}, where {username} is $('#loginUsername').value
  //     decode response from json to object called doc
  //     if doc.error, call showError(doc.error)
  //     otherwise, if doc.password is NOT the same as $('#loginPassword').value,
  //       call showError('Username and password do not match.')
  //     otherwise, call openHomeScreen(doc)
  //   use .catch(err=>showError('ERROR: '+err)}) to show any other errors
  var data = {
    password: $("#loginPassword").value,
    username: $("#loginUsername").value,
  };
  fetch("/users/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
    .then((r) => r.json())
    .then((doc) => {
      if (doc.error) {
        showError(doc.error);
        return;
      }
      if (doc.authToken) {
        localStorage.setItem("token", doc.authToken);
      }
      openHomeScreen(doc);
    })
    .catch((err) => showError("ERROR: " + err));
});

// AddTodo button action
$("#todoButton").addEventListener("click", () => {
  var data = $("#todoContent").value;
  console.log(data);
  const authToken = localStorage.getItem("token");
  fetch(`/users/${authToken}/todos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: data }),
  })
    .then((r) => r.json())
    .then((doc) => {
      if (doc.error) {
        showError(doc.error);
      } else {
        openHomeScreen(doc);
      }
      if (doc.authToken) {
        localStorage.setItem("token", doc.authToken);
      }
    })
    .catch((err) => showError("ERROR: " + err));
});

// Update button action
$("#updateBtn").addEventListener("click", () => {
  let authToken = localStorage.getItem("token");
  let checkboxes = Array.from($("#submain").children);
  console.log(checkboxes);

  // create array to store selected todo items
  const selectedTodos = [];

  // loop through checkboxes to find selected items
  checkboxes.forEach((checkbox) => {
    if (Array.from(checkbox.classList).indexOf("completed") != -1) {
      // add todo item to array
      selectedTodos.push(parseInt(checkbox.id));
    }
  });

  console.log("Checked --> " + selectedTodos);

  // send selected todo items to server
  fetch(`/users/${authToken}/todos`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ selectedTodos: selectedTodos }),
  })
    .then((response) => response.json())
    .then((data) => console.log(data))
    .catch((error) => console.log(error));
});

// Delete button action
$("#deleteBtn").addEventListener("click", () => {
  // confirm that the user wants to delete
  if (!confirm("Are you sure you want to delete your profile?")) return;
  // TODO:
  //   DELETE /users/{username}, where {username} is $('#username').innerText
  //     decode response from json to object called doc
  //     if doc.error, showError(doc.error)
  //     otherwise, openLoginScreen()
  //   use .catch(err=>showError('ERROR: '+err)}) to show any other errors

  const username = $("#username").innerText;
  const authToken = localStorage.getItem("token");
  fetch(`/users/${username}/${authToken}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  })
    .then((r) => r.json())
    .then((doc) => {
      if (doc.error) {
        showError(doc.error);
      } else {
        openLoginScreen();
      }
    })
    .catch((err) => showError("ERROR: " + err));
});

function showListOfUsers() {
  // TODO:
  //   GET /users
  //     decode response from json to an array called docs
  //     for every doc in docs, call showUserInList(doc)
  //       you can do this by using a for-loop or, better yet, a forEach function:
  //         docs.forEach(showUserInList)
  //   use .catch(err=>showError('Could not get user list: '+err)}) to show any potential errors

  fetch("/users")
    .then((r) => r.json())
    .then((docs) => {
      docs.forEach(showUserInList);
    })
    .catch((err) => showError("Could not get user list: " + err));
}

function showUserInList(doc) {
  // add doc.username to #userlist
  var item = document.createElement("li");
  $("#userlist").appendChild(item);
  item.innerText = doc.username;
}

function showError(err) {
  // show error in dedicated error div
  $("#error").innerText = err ? err : "";
}

function resetInputs() {
  // clear all input values
  var inputs = document.getElementsByTagName("input");
  for (var input of inputs) {
    input.value = "";
  }
}

function openHomeScreen(doc) {
  // hide other screens, clear inputs, clear error
  $("#loginScreen").classList.add("hidden");
  $("#registerScreen").classList.add("hidden");
  resetInputs();
  showError("");
  // reveal home screen
  $("#homeScreen").classList.remove("hidden");
  // $("#notInHomeScreen").remove();
  // display name, username
  // display name, if available
  if (doc.name) {
    $("#name").innerHTML = doc.name;
  }

  // Fetch the todos from the server
  const authToken = localStorage.getItem("token");

  fetch(`/users/${authToken}/todos`, {
    headers: { "Content-Type": "application/json" },
  })
    .then((response) => response.json())
    .then((data) => {
      allTodos = data;
      $("#submain").innerHTML = "";
      // Loop through the todos and create an HTML element for each one
      data.todos.forEach((todo) => {
        const li = document.createElement("li");
        li.innerText = todo.title;
        li.id = todo.id;
        if (todo.isCompleted) {
          li.classList.add("completed");
        } else {
          li.classList.add("todo");
        }
        li.addEventListener("click", function () {
          li.classList.toggle("completed");
          li.classList.toggle("todo");
        });

        $("#submain").appendChild(li);
      });
    })
    .catch((error) => {
      console.error("Error fetching todos:", error);
    });
  // $("#username").innerText = doc.username;
  // display updatable user info in input fields
  // $("#updateName").value = doc.name;
  // $("#updateEmail").value = doc.email;

  const mainDiv = $("#submain");
  const todoTextInput = $("#todoContent");
  const todoAddButton = $("#todoButton");

  function addTodo() {
    if (todoTextInput.value != "") {
      var d = document.createElement("li");
      mainDiv.appendChild(d);
      d.innerHTML = todoTextInput.value;
      d.classList.add("todo");
      d.addEventListener("click", function () {
        d.classList.toggle("completed");
        d.classList.toggle("todo");
      });
      todoTextInput.value = "";
    }
  }
  todoAddButton.addEventListener("click", addTodo);
}

function openLoginScreen() {
  // hide other screens, clear inputs, clear error
  $("#registerScreen").classList.add("hidden");
  $("#homeScreen").classList.add("hidden");
  resetInputs();
  showError("");
  // reveal login screen
  $("#loginScreen").classList.remove("hidden");
}

function openRegisterScreen() {
  // hide other screens, clear inputs, clear error
  $("#loginScreen").classList.add("hidden");
  $("#homeScreen").classList.add("hidden");
  resetInputs();
  showError("");
  // reveal register screen
  $("#registerScreen").classList.remove("hidden");
}
