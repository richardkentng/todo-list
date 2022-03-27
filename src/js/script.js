console.log("sanity check");

displayTodos(getTodos());

const todoForm = document.body.querySelector(".todo-form");
const todoInput = todoForm.querySelector("#todo-input");
const todoList = document.body.querySelector(".todo-list");
const todoItems = document.body.querySelectorAll(".todo-item");
const todoTextEls = document.body.querySelectorAll(".todo-text");
let elementsBeingAnimated = [];

//=================================================/
//--------------ADD EVENT LISTENERS ---------------/
//=================================================/

todoForm.addEventListener("submit", onSubmitTodoForm);
todoList.addEventListener("click", onClickTodoList);
todoTextEls.forEach((todoTextEl) =>
  todoTextEl.addEventListener("input", onInput_todoText)
);

//=================================================/
//------------------- FUNCTIONS -------------------/
//=================================================/

function onSubmitTodoForm(e) {
  e.preventDefault();

  if (!isUniqueText()) return;

  //create todo object
  const newTodo = {
    id: `a${getRandomString()}`,
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
  //  This will be used to decide the hierarchicial context of what was clicked on
  //  For example, questions like these can be answered:
  //   Did the click occur inside an element with a class of .todo-item?
  //      Relevance: among the path elements, look for an element with that class
  //   If the above is true, did the click take place inside a button element?
  //      Relevance: among the path elements, look for an element with a class of button, whose index is smaller than the that of the element found above

  //populate path:
  const path = [];
  let walker = e.target;
  while (walker !== document.body.parentElement) {
    path.push(walker);
    walker = walker.parentElement;
  }

  const button_todoItem = checkPath(path, "button .todo-item");
  if (button_todoItem) {
    //if click originated from a button inside a .todo-item element
    const [button, todoItem] = button_todoItem;
    //run a todo function based off of the dataset.todoAction value
    window[`${button.dataset.todoAction}Todo`](todoItem.id);
  }
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

//The 'checkPath' function verifies whether the clicked target is
//surrounded by specific tag(s)/class(es)/id(s) in a specific order
//  for every passed in tag/class/id (second argument), the function will
//  return the respective discovered element(s) in the same order
//      example call:       checkPath(e.path, "button .todo-item")
//      example return:     [<button>click me</button>, <li class="todo-item"></li>]
//          (if just one element is returned, it will not be returned as an array)

function checkPath(
  pathEls,
  selectorStringOrder,
  cutoffElement,
  immediateMatch = false
) {
  //*** The 'cutoffElement', if provided, will constrain the pathEls to a smaller array
  //that is heirarchically closer to the clicked element (NOT inclusive of cutoffElement)

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

  const milestones = selectorStringOrder.trim().split(/ +/);
  //milestones represent the selector-like strings for which we aim to find in pathEls
  //eg. milestones:  ['button', '.todo-item']

  let milestoneIndex = milestones.length - 1;
  let milestone = milestones[milestoneIndex];
  const foundMilestones = [];

  //loop through the path from the outer layer to the inner layer (toward the clicked element)
  for (let i = pathEls.length - 1; i >= 0; i--) {
    const pathEl = pathEls[i];
    //    check if the current pathElement matches the current milestone
    if (isMatch(pathEl, milestone)) {
      foundMilestones.unshift(pathEl);
      //if all milestones have been found
      if (foundMilestones.length === milestones.length) {
        if (foundMilestones.length === 1) return foundMilestones[0];
        else return foundMilestones;
      }
      //else: update milestone being checked
      updateMilestone();
      //if there is no match AND an immediateMatch is required AND we just finished testing the first pathEl, then return error message:
    } else if (immediateMatch && i === pathEls.length - 1) {
      console.group("immediateMatch failed");
      console.error(
        "An immediateMatch was required, but the following pathEl does not match the specified tag/id/class chunk:"
      );
      console.log(pathEl);
      console.log(milestone);
      console.groupEnd("immediateMatch failed");
      return;
    }
  }
  return;

  function updateMilestone() {
    milestoneIndex--;
    milestone = milestones[milestoneIndex];
  }

  function isMatch(pathEl, concatenatedTagIdClasses) {
    //example arguments:  (<div class="some-class">lorem</div>, "someTagName.some-class#some-id")
    //      ** the second argument should have at least one among the following: tag/class/id

    const tagIdClasses = getTagIdClasses(concatenatedTagIdClasses);
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
  const todoList = document.body.querySelector(".todo-list");
  hideOrShow(todoList, todoObjs.length);
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
  function hideOrShow(element, numOfTodos) {
    element.classList[numOfTodos >= 1 ? "add" : "remove"]("d-flex");
  }
}

function save_display_todos(todos) {
  saveTodos(todos);
  displayTodos(todos);
}

function getRandomString() {
  return Math.random()
    .toString()
    .match(/[0-9]{2,}/)[0];
}

function animateJump(ele) {
  //if there is an animation in progress, abort
  const isElementBeingAnimated = elementsBeingAnimated.includes(ele);
  if (isElementBeingAnimated) {
    //then visually snap element to original position before continuing animation

    //remove transition
    ele.style.transition = "";
    //reset position
    ele.style.transform = "translateY(0)";
    //remove from elementsBeingAnimated
    elementsBeingAnimated = elementsBeingAnimated.filter(
      (elem) => elem !== ele
    );
  }

  //checkpoint: element is not being animated

  elementsBeingAnimated.push(ele);

  const originalBottomPosition = ele.getBoundingClientRect().bottom;

  //enable animation capability & set duration
  ele.style.transition = "transform 0.1s";

  //listen for end of animations
  ele.addEventListener("transitionend", onTransitionEnd);

  //start upward animation
  ele.style.transform = "translateY(-10px)";

  //after a delay:
  function onTransitionEnd() {
    //this will run twice:
    //  once when the element reaches max height,
    //  and again when the element has returned to its original location

    const elementIsAtMaxHeight =
      ele.getBoundingClientRect().bottom !== originalBottomPosition;

    if (elementIsAtMaxHeight) {
      //start animation to move it back down
      return (ele.style.transform = "translateY(0)");
    }
    //checkpoint: element is in original position

    ele.removeEventListener("transitionend", onTransitionEnd);

    //remove element from 'elementsBeingAnimated'
    elementsBeingAnimated = elementsBeingAnimated.filter(
      (elem) => elem !== ele
    );
  }
}
