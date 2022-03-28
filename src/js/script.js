console.log("sanity check");

const todoForm = document.body.querySelector(".todo-form");
const todoInput = todoForm.querySelector("#todo-input");
const todoList = document.body.querySelector(".todo-list");
const todoItems = document.body.querySelectorAll(".todo-item");
const todoTextEls = document.body.querySelectorAll(".todo-text");

// ADDRESS OLDER CODE
conditionallyGiveAllTodosOrderValue();

// DISPLAY TODOS
displayTodos(getTodos());

//=================================================/
//--------------ADD EVENT LISTENERS ---------------/
//=================================================/

todoForm.addEventListener("submit", onSubmitTodoForm); //adds todo
todoList.addEventListener("click", onClickTodoList); //toggle done or delete todo
todoTextEls.forEach(
  (todoTextEl) => todoTextEl.addEventListener("input", onInput_todoText) //save text edits
);

//=================================================/
//------------------- FUNCTIONS -------------------/
//=================================================/

function onSubmitTodoForm(e) {
  e.preventDefault();

  if (!isUniqueText()) return;

  //create todo object
  const newTodo = {
    id: generateId(),
    text: todoInput.value.trim(),
    done: false,
    doneTime: "",
    createdTime: Date.now(),
  };

  addTodo(newTodo);

  //clear input
  todoInput.value = "";
}

function onClickTodoList(e) {
  //Create a 'path': an array of elements that represents the nesting structure of the clicked element
  //  ^will be used to determine the context of what was clicked on
  const path = [];
  let walker = e.target;
  while (walker !== document.body.parentElement) {
    path.push(walker);
    walker = walker.parentElement;
  }

  //check if the click originated from a button, which was inside a .todo-item
  const button_todoItem = checkPath(path, "button .todo-item");
  if (button_todoItem) {
    const [button, todoItem] = button_todoItem;
    // based on the button's function, do something
    if (button.dataset.todoAction === "toggleDone") toggleDoneTodo(todoItem.id);
    else if (button.dataset.todoAction === "delete") deleteTodo(todoItem.id);
  }
}

//The 'checkPath' function:
//  Given a path (an array of elements describing the nesting structure of a clicked element),
//    and one or more css selectors,
//    check if the elements in the path match the css selectors
//    if everything matches, then return the matched elements, else return undefined

function checkPath(
  pathEls, //eg. [<button>delete</button>, <div class="buttons"></div>, <li class="todo-item">wash dishes</li>, etc.]
  selectorsStr, //eg. "button li.todo-item"
  cutoffElement, //optional (if provided, will constrain pathEls to a smaller array (NOT inclusive of cutoffElement))
  immediateMatch = false //if set to true: requires that the outermost pathEl matches the outermost selector
) {
  if (cutoffElement) {
    const cutoffElement_index = pathEls.findIndex(
      (pathEl) => pathEl === cutoffElement
    );
    const cannotFindCutoffElementInPath = !(cutoffElement_index >= 0);
    if (cannotFindCutoffElementInPath) {
      console.error("Failed to find cutoffElement in path:", cutoffElement);
      return;
    }
    pathEls = pathEls.slice(0, cutoffElement_index); //✔️ pathEls has been shortened
  }

  const selectors = selectorsStr.trim().split(/ +/);

  let selectorIndex = selectors.length - 1; //the position of the selector being checked for
  let selector = selectors[selectorIndex]; //the selector being checked for
  const matchingElements = []; //the elements that match selectors

  //loop through the path from the outer layer to the inner layer (toward the clicked element)
  for (let i = pathEls.length - 1; i >= 0; i--) {
    const pathEl = pathEls[i];
    //    check if the current pathElement matches the current selector
    if (isMatch(pathEl, selector)) {
      matchingElements.unshift(pathEl);
      //if all selectors have been found
      if (matchingElements.length === selectors.length) {
        if (matchingElements.length === 1) return matchingElements[0];
        else return matchingElements;
      }
      //else: update selector being checked for
      updateSelector();
      //if there is no match AND an immediateMatch is required AND we just finished testing the outermost pathEl, then return error message:
    } else if (immediateMatch && i === pathEls.length - 1) {
      console.group("immediateMatch failed");
      console.error(
        "An immediateMatch was required, but the following pathEl does not match the specified selector:"
      );
      console.log(pathEl);
      console.log(selector);
      console.groupEnd("immediateMatch failed");
      return;
    }
  }
  return;

  function updateSelector() {
    selectorIndex--;
    selector = selectors[selectorIndex];
  }

  function isMatch(pathEl, selector) {
    //example arguments:  (<div class="some-class">lorem</div>, "someTagName.some-class#some-id")
    //      ** the second argument should have at least one among the following: tag/class/id

    const tagIdClasses = getTagIdClasses(selector);
    //example return value:  ['someTagName', '.some-class', '.another-class', '#some-id']

    //loop through every tag/id/class^^
    for (let i = 0; i < tagIdClasses.length; i++) {
      // if tag/id/class does NOT match the element, return false
      if (!isMatch_element_tagClassId(pathEl, tagIdClasses[i])) return false;
    }
    return true;

    //local functions:
    function isMatch_element_tagClassId(ele, tagIdClass) {
      switch (tagIdClass[0]) {
        case ".":
          const classWithoutDot = tagIdClass.replace(/^\./, "");
          return ele.classList.contains(classWithoutDot);
          break;
        case "#":
          const idWithoutNumSign = tagIdClass.replace(/^#/, "");
          return ele.id === idWithoutNumSign;
          break;
        default:
          const uppercaseTag = tagIdClass.toUpperCase();
          return ele.tagName === uppercaseTag;
          break;
      }
    }

    function getTagIdClasses(str) {
      const tags = str.match(/^[a-zA-Z]+/g) || [];
      const classes = str.match(/\.[^\.#]+/g) || [];
      const ids = str.match(/\#[^\.#]+/g) || [];
      return tags.concat(classes).concat(ids);
    }
  }
}

function isUniqueText() {
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

function addTodo(todo) {
  const todos = getTodos();
  todos.push(todo);
  save_display_todos(todos);

  //listen for input on the .todo-text element
  const todoTextEl = document.body.querySelector(
    `.todo-item#${todo.id} .todo-text`
  );
  todoTextEl.addEventListener("input", onInput_todoText);
}

function deleteTodo(todoId) {
  let todos = getTodos();
  todos = todos.filter((todo) => todo.id !== todoId);
  save_display_todos(todos);
}

function onInput_todoText() {
  const todoId = getOuterTodoId(this);
  const todos = getTodos().map((todo) => {
    //update the textContent of a specific todo
    if (todo.id === todoId) todo.text = this.textContent;
    return todo;
  });
  saveTodos(todos);

  //local function:
  function getOuterTodoId(walker) {
    while (!walker.classList.contains("todo-item")) {
      walker = walker.parentElement;
    }
    return walker.id;
  }
}

function toggleDoneTodo(todoId) {
  //inverse todo.done value of specific todo
  const todos = getTodos().map((todo) => {
    if (todo.id === todoId) todo.done = !todo.done;
    return todo;
  });
  save_display_todos(todos);
}

function getTodos() {
  return JSON.parse(localStorage.getItem("todos")) || [];
}

function saveTodos(todoObjs) {
  localStorage.setItem("todos", JSON.stringify(todoObjs));
}

function displayTodos(todoObjs) {
  if (!todoObjs.length) return hide(todoList);
  else show(todoList);

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

  //display todos
  todoList.innerHTML = todosUI;

  //local functions
  function hide(element) {
    element.classList.remove("d-flex");
  }
  function show(element) {
    element.classList.add("d-flex");
  }
}

function save_display_todos(todos) {
  saveTodos(todos);
  displayTodos(todos);
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
