console.log("sanity check");

const todoForm = document.body.querySelector(".todo-form");
const todoInput = todoForm.querySelector("#todo-input");
const todoList = document.body.querySelector(".todo-list");
const todoItems = document.body.querySelectorAll(".todo-item");
let moveTodoNewOrder = null;

// ADDRESS OLDER CODE
conditionallyGiveAllTodosOrderValue();

// DISPLAY TODOS
displayTodos(getTodos());

//=================================================/
//-------------- ADD EVENT LISTENERS --------------/
//=================================================/

todoForm.addEventListener("submit", onSubmitTodoForm);

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

  const todosUI = todoObjs
    .map((todo) => {
      return `
      <li class="todo-item ${todo.done ? "done" : ""}" id="${
        todo.id
      }" data-order="${todo.order}">
        <button class="move-todo-btn"><i class="bi-arrow-down-up"></i></button>
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

  const moveTodoBtns = document.body.querySelectorAll(".move-todo-btn");
  moveTodoBtns.forEach((moveBtn) => {
    moveBtn[`${action}EventListener`]("mousedown", onMouseDown_moveBtn);
  });
}

function onMouseDown_moveBtn() {
  const moveTodo = getOuterTodo(this);
  moveTodo.classList.add("bright");
  document.addEventListener("mousemove", onMouseMove_showTodoOrderLine);
  //prettier-ignore
  document.addEventListener("mouseup", onMouseUp_afterMoveIcon, { once: true });

  function onMouseMove_showTodoOrderLine(mousemoveEvent) {
    clearOrderBordersFromTodos();

    const mousemoveTarget = mousemoveEvent.target;
    const overTodo = getOuterTodo(mousemoveTarget); //get the todo element under the mouse

    //if there is no todo under mouse || the mouse is over the same todo
    if (!overTodo || overTodo === moveTodo) {
      moveTodoNewOrder = null;
      return;
    }

    //*** add a border & set moveableTodoOrder
    const overTodoOrder = parseInt(overTodo.dataset.order);
    const moveTodoOrder = parseInt(moveTodo.dataset.order);

    //if overTodo is right above moveTodo
    if (overTodoOrder === moveTodoOrder - 1) {
      showTopBorder_setOrder();
    }
    //else if overTodo is right below moveTodo
    else if (overTodoOrder === moveTodoOrder + 1) {
      showBottomBorder_setOrder();
    } else {
      if (isMouseInTopHalf()) {
        showTopBorder_setOrder();
      } else {
        showBottomBorder_setOrder();
      }
    }
    //-----------local functions-----------
    function isMouseInTopHalf() {
      let offsetY = mousemoveEvent.offsetY;
      offsetY = normalizeOffset(); //y position of mouse relative to todo container
      return offsetY < overTodo.getBoundingClientRect().height / 2;
      //-----local functions------
      function normalizeOffset() {
        //*** adjust offsetY to always reflect 'overTodo' offsetY instead of mousemoveTarget offsetY
        const mouseIsOverTodoOnly = mousemoveTarget === overTodo;
        if (mouseIsOverTodoOnly) return offsetY;
        //else if mouse is over a child element of overTodo:
        const adjustedOffsetY =
          mousemoveTarget.getBoundingClientRect().top -
          overTodo.getBoundingClientRect().top +
          mousemoveEvent.offsetY;
        return adjustedOffsetY;
      }
    }
    function showTopBorder_setOrder() {
      overTodo.classList.add("top-border");
      moveTodoNewOrder = overTodoOrder - 0.5;
    }
    function showBottomBorder_setOrder() {
      overTodo.classList.add("bottom-border");
      moveTodoNewOrder = overTodoOrder + 0.5;
    }
    function clearOrderBordersFromTodos() {
      document.body.querySelectorAll(".todo-item").forEach((todoEl) => {
        todoEl.classList.remove("top-border");
        todoEl.classList.remove("bottom-border");
      });
    }
  }

  function onMouseUp_afterMoveIcon() {
    //disable hover to show order border effect
    document.removeEventListener("mousemove", onMouseMove_showTodoOrderLine);
    moveTodo.classList.remove("bright");

    if (moveTodoNewOrder === null) return;

    //update order value of moveTodo
    const todos = getTodos().map((todo) => {
      if (todo.id === moveTodo.id) {
        todo.order = moveTodoNewOrder;
      }
      return todo;
    });

    moveTodoNewOrder = null; //prevents accidental re-ordering when normal clicking .move-btn

    todos.sort((a, b) => a.order - b.order);

    //set all todo.order values to integers
    todos.forEach((todo, i) => {
      todo.order = i + 1;
    });

    save_display_todos(todos);
  }
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
    insertToast("Please enter a unique task.", todoInput, {
      addMarginUnderEl: todoForm,
    });
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

//=================================================/
//---------------- CRUD FUNCTIONS -----------------/
//=================================================/

function addTodo(todo) {
  const todos = getTodos();
  todos.push(todo);
  save_display_todos(todos);
}

function deleteTodo() {
  const todoId = getOuterTodo(this).id;
  let todos = getTodos();
  todos = todos.filter((todo) => todo.id !== todoId);
  save_display_todos(todos);
}

function saveTodoText() {
  const todoId = getOuterTodo(this).id;
  const todos = getTodos().map((todo) => {
    //update the textContent of a specific todo
    if (todo.id === todoId) todo.text = this.textContent;
    return todo;
  });
  saveTodos(todos);
}

function toggleDoneTodo() {
  const todoId = getOuterTodo(this).id;
  //inverse todo.done value of specific todo
  const todos = getTodos().map((todo) => {
    if (todo.id === todoId) todo.done = !todo.done;
    return todo;
  });
  save_display_todos(todos);
}

// HELPER FUNCTION FOR TODO ITEM EVENTS

function getOuterTodo(targetEl) {
  let walker = targetEl;
  while (true) {
    if (walker == null) return false;
    if (walker.classList.contains("todo-item")) return walker;
    walker = walker.parentElement;
  }
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
  const someTodosLackOrderValue = todos.some(
    (todo) => todo.order === undefined
  );
  if (!someTodosLackOrderValue) return;
  for (let i = 0; i < todos.length; i++) {
    todos[i].order = i + 1;
  }
  saveTodos(todos);
  console.log(
    `%c ran function: conditionallyGiveAllTodosOrderValue()`,
    "color: gold;"
  );
}

//=================================================/
//--------------- UTILITY FUNCTIONS ---------------/
//=================================================/

function insertToast(text, refElement, options) {
  const toastStr = `
  <div class="my-toast">
    <i class="arrow-icon bi-caret-up-fill"></i>
    <div class="box">
      <i class="bang-icon bi-exclamation-square-fill"></i>
      <span class="text">${text}</span>
    </div>
  </div>`;
  document.body.insertAdjacentHTML("beforeend", toastStr);
  const toast = document.body.lastChild;
  //position based on refElement:
  const { x: refX, bottom: refBottom } = refElement.getBoundingClientRect();
  toast.style.left = refX + window.scrollX + "px";
  toast.style.top = refBottom + window.scrollY - 8 + "px"; //subtract 8 to adjust for the whitespace around arrow

  const addMarginUnderEl = options.addMarginUnderEl;
  if (addMarginUnderEl) {
    addMarginUnderEl.style.marginBottom =
      toast.getBoundingClientRect().height * 2 + "px";
  }

  //vanish after 3 seconds:
  setTimeout(() => {
    toast.remove();
    if (addMarginUnderEl) addMarginUnderEl.style.marginBottom = "0";
  }, 3000);
}
