console.log("sanity check");

const todoForm = document.body.querySelector(".todo-form");
const todoInput = todoForm.querySelector("#todo-input");
const todoList = document.body.querySelector(".todo-list");

todoForm.addEventListener("submit", onSubmitTodoForm);

function onSubmitTodoForm(e) {
  e.preventDefault();

  const todoLi = document.createElement("li");
  todoLi.textContent = todoInput.value;
  todoList.appendChild(todoLi);
}
