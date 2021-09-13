const express = require('express');
const cors = require('cors');

const {v4: uuidv4} = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const {username} = request.headers;

  const userDoesNotExist = !users.some((user) => user.username === username);

  if (userDoesNotExist) {
    return response.status(404).json({
      error: 'User does not exist',
    });
  }

  next();
}

app.post('/users', (request, response) => {
  const {name, username} = request.body;

  const usernameAlreadyInUse = users.some((user) => user.username === username);

  if (usernameAlreadyInUse) {
    return response.status(400).json({
      error: 'Username already in use!',
    });
  }

  const userObject = {
    id: uuidv4,
    name,
    username,
    todos: [],
  };

  users.push(userObject);

  response.status(201).json(userObject);
});

app.get('/todos', checksExistsUserAccount, (request, response) => {
  const {username} = request.headers;

  const {todos} = users.find((user) => user.username === username);

  response.status(200).json(todos);
});

app.post('/todos', checksExistsUserAccount, (request, response) => {
  const {title, deadline} = request.body;
  const {username} = request.headers;

  const todoObject = {
    id: uuidv4(),
    title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date(),
  };

  const userIndex = users.findIndex((user) => user.username === username);

  users[userIndex].todos.push(todoObject);

  response.status(201).json(todoObject);
});

app.put('/todos/:id', checksExistsUserAccount, (request, response) => {
  const {title, deadline} = request.body;
  const {username} = request.headers;
  const {id} = request.params;

  const userIndex = users.findIndex((user) => user.username === username);
  const userTodos = users[userIndex].todos;

  userTodos.forEach((todo, index) => {
    if (todo.id === id) {
      const updatedTodo = {
        ...userTodos[index],
        title,
        deadline,
      };

      userTodos[index] = {...updatedTodo};

      delete updatedTodo.created_at;

      return response.status(200).json(updatedTodo);
    }
  });

  response.status(404).json({error: 'Todo not found'});
});

app.patch('/todos/:id/done', checksExistsUserAccount, (request, response) => {
  const {username} = request.headers;
  const {id} = request.params;

  const userIndex = users.findIndex((user) => user.username === username);
  const userTodos = users[userIndex].todos;

  userTodos.forEach((todo, index) => {
    if (todo.id === id) {
      const updatedTodo = {
        ...userTodos[index],
        done: true,
      };

      userTodos[index] = updatedTodo;

      return response.status(200).json(updatedTodo);
    }
  });

  response.status(404).json({error: 'Todo not found'});
});

app.delete('/todos/:id', checksExistsUserAccount, (request, response) => {
  const {username} = request.headers;
  const {id} = request.params;

  const userIndex = users.findIndex((user) => user.username === username);
  const userTodos = users[userIndex].todos;

  userTodos.forEach((todo, index) => {
    if (todo.id === id) userTodos.splice(index, 1);
  });

  response.status(200).json({message: 'Todo item removed'});
});

module.exports = app;
