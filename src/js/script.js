console.log("sanity check");

displayTodos(getTodos());

const todoForm = document.body.querySelector(".todo-form");
const todoInput = todoForm.querySelector("#todo-input");

todoForm.addEventListener("submit", onSubmitTodoForm);

//=================================================/
//-------------------FUNCTIONS --------------------/
//=================================================/

function onSubmitTodoForm(e) {
  e.preventDefault();

  //create todo object
  const newTodo = {
    text: todoInput.value,
    done: false,
    doneTime: "",
    createdTime: Date.now(),
  };

  // add one todo to local storage
  const savedTodos = getTodos();
  savedTodos.push(newTodo);
  localStorage.setItem("todos", JSON.stringify(savedTodos));

  displayTodos(savedTodos);
}

function displayTodos(todoObjs) {
  //map through todo objects to create HTML
  const todosStr = todoObjs.map((todo) => `<li>${todo.text}</li>`).join("");
  //display todos
  const todoList = document.body.querySelector(".todo-list");
  todoList.innerHTML = todosStr;
}

function getTodos() {
  return JSON.parse(localStorage.getItem("todos")) || [];
}
