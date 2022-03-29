console.log("sanity check");

const todoForm = document.body.querySelector(".todo-form");
todoForm.addEventListener("submit", onSubmitTodoForm);
const todoInput = todoForm.querySelector("#todo-input");
const todoList = document.body.querySelector(".todo-list");
const todoItems = document.body.querySelectorAll(".todo-item");

// ADDRESS OLDER CODE
conditionallyGiveAllTodosOrderValue();

// DISPLAY TODOS
displayTodos(getTodos());

//=================================================/
//------------------- FUNCTIONS -------------------/
//=================================================/

function onSubmitTodoForm(e) {
  e.preventDefault();

  if (!isUniqueText()) return;

  const newTodo = {
    id: generateId(),
    text: todoInput.value.trim(),
    done: false,
    doneTime: "",
    createdTime: Date.now(),
  };
  addTodo(newTodo);

  todoInput.value = ""; //clears input
}

function displayTodos(todoObjs) {
  if (todoObjs.length === 0) hideTodoList();
  else showTodoList();

  todoObjs.sort((a, b) => a.order - b.order);

  const todosUI = todoObjs
    .map((todo) => {
      return `
      <li class="todo-item ${todo.done ? "done" : ""}" id="${todo.id}">
        <span class="todo-text" contenteditable>${todo.text}</span>
        <button class="done-todo-btn" data-todo-action="toggleDone">Done</button>
        <button class="delete-todo-btn" data-todo-action="delete">Delete</button>
      </li>`;
    })
    .join("");

  editTodoItemEventListeners("remove");
  todoList.innerHTML = todosUI; //display todos
  editTodoItemEventListeners("add");

  //local functions
  function hideTodoList() {
    todoList.classList.remove("d-flex");
  }
  function showTodoList() {
    todoList.classList.add("d-flex");
  }
}

function save_display_todos(todos) {
  saveTodos(todos);
  displayTodos(todos);
}

function editTodoItemEventListeners(action) {
  const doneTodoBtns = document.body.querySelectorAll(".done-todo-btn");
  doneTodoBtns.forEach((btn) =>
    btn[`${action}EventListener`]("click", toggleDoneTodo)
  );

  const deleteTodoBtns = document.body.querySelectorAll(".delete-todo-btn");
  deleteTodoBtns.forEach((btn) =>
    btn[`${action}EventListener`]("click", deleteTodo)
  );

  //save text edits:
  const todoTextEls = document.body.querySelectorAll(".todo-text");
  todoTextEls.forEach((todoTextEl) =>
    todoTextEl[`${action}EventListener`]("input", saveTodoText)
  );
}

function isUniqueText() {
  //checks whether the text in the .todo-input is unique amongst the existing todos' text
  const todoWithSameTextObj = getTodos().find(
    (todoObj) =>
      todoObj.text.toLowerCase() === todoInput.value.trim().toLowerCase()
  );
  if (todoWithSameTextObj) {
    const todoWithSameTextEl = document.body.querySelector(
      `#${todoWithSameTextObj.id}`
    );
    animateJump(todoWithSameTextEl);
    return false;
  }
  return true;
}

function generateId() {
  return (
    "a" +
    Math.random()
      .toString()
      .match(/[0-9]{2,}/)[0]
  );
}

function animateJump(ele) {
  //if there is already an animation in progress, then reset element's transform, then redo animation
  if (ele.dataset.animationState === "animating") {
    //reset element's position
    ele.style.transition = "transform 0.001s"; //<this duration, despite it being short, will still trigger onTransitionEnd()
    ele.style.transform = "translateY(0)";
    //this will redo the animation:
    ele.dataset.animationNextStep = "redo";
    return;
  }

  //checkpoint: element is NOT being animated, so animate it!:

  ele.dataset.animationState = "animating";

  const originalBottomPosition = ele.getBoundingClientRect().bottom;

  //enable animation & set duration
  ele.style.transition = "transform 0.1s";

  //listen for end of animations
  ele.addEventListener("transitionend", onTransitionEnd);

  //start upward animation
  ele.style.transform = "translateY(-10px)";

  function onTransitionEnd() {
    const elementIsAtMaxHeight =
      ele.getBoundingClientRect().bottom !== originalBottomPosition;

    if (elementIsAtMaxHeight) {
      //1 the element is at MAX HEIGHT
      // begin moving element back down
      ele.style.transform = "translateY(0)";
      return;
    }
    //2 the element is in ORIGINAL POSITION:

    //remove event listener
    ele.removeEventListener("transitionend", onTransitionEnd);

    //reset animation state
    ele.dataset.animationState = "";

    //conditionally redo the animation (this occurs if the animation on a particular-
    //  -element is triggered again, before the previous animation has finished)
    if (ele.dataset.animationNextStep === "redo") {
      ele.dataset.animationNextStep = "";
      animateJump(ele);
    }
  }
}

//=================================================/
//---------------- CRUD FUNCTIONS -----------------/
//=================================================/

function addTodo(todo) {
  const todos = getTodos();
  todos.push(todo);
  save_display_todos(todos);
}

function deleteTodo() {
  const todoId = getOuterTodoId(this);
  let todos = getTodos();
  todos = todos.filter((todo) => todo.id !== todoId);
  save_display_todos(todos);
}

function saveTodoText() {
  const todoId = getOuterTodoId(this);
  const todos = getTodos().map((todo) => {
    //update the textContent of a specific todo
    if (todo.id === todoId) todo.text = this.textContent;
    return todo;
  });
  saveTodos(todos);
}

function toggleDoneTodo() {
  const todoId = getOuterTodoId(this);
  //inverse todo.done value of specific todo
  const todos = getTodos().map((todo) => {
    if (todo.id === todoId) todo.done = !todo.done;
    return todo;
  });
  save_display_todos(todos);
}

// HELPER FUNCTION FOR TODO ITEM EVENTS
function getOuterTodoId(walker) {
  while (!walker.classList.contains("todo-item")) {
    walker = walker.parentElement;
  }
  return walker.id;
}

//=================================================/
//---------------- LOCAL STORAGE ------------------/
//=================================================/

function getTodos() {
  return JSON.parse(localStorage.getItem("todos")) || [];
}

function saveTodos(todoObjs) {
  localStorage.setItem("todos", JSON.stringify(todoObjs));
}

//=================================================/
//------- FUNCTIONS THAT ADDRESS OLDER CODE -------/
//=================================================/

function conditionallyGiveAllTodosOrderValue() {
  //each todo item must have an order value so that it's order in the todo list can be recorded and manipulated
  const todos = getTodos();
  if (!todos.length) return;
  const allTodosLackOrderValue = todos.every(
    (todo) => todo.order === undefined
  );
  if (!allTodosLackOrderValue) return;
  for (let i = 0; i < todos.length; i++) {
    todos[i].order = i + 1;
  }
  saveTodos(todos);
}
