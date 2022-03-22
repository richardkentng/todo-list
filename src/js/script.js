console.log("sanity check");

const todoForm = document.body.querySelector(".todo-form");
const todoInput = todoForm.querySelector("#todo-input");
const todoList = document.body.querySelector(".todo-list");
const todoItems = document.body.querySelectorAll(".todo-item");

displayTodos(getTodos());

todoForm.addEventListener("submit", onSubmitTodoForm);
todoList.addEventListener("click", onClickTodoList);

//=================================================/
//-----------------CORE FUNCTIONS -----------------/
//=================================================/

function onSubmitTodoForm(e) {
  e.preventDefault();

  //create todo object
  const newTodo = {
    id: getRandomString(),
    text: todoInput.value,
    done: false,
    doneTime: "",
    createdTime: Date.now(),
  };

  //clear todo input
  todoInput.value = "";

  // add one todo to local storage
  const todos = getTodos();
  todos.push(newTodo);
  save_display_todos(todos);
}

function onClickTodoList(e) {
  //the following nested if-statements represent the hierarchy of elements from which
  //the click originated.  If the if-statement is true, it means it has been clicked into.
  const todoItem = checkPath(e.path, ".todo-item");
  if (todoItem) {
    //HEIRARCHY: todoItem
    const button = checkPath(e.path, "button", todoItem);
    if (button) {
      //HEIRARCHY: todoItem > button
      //determine which button was clicked, take according action
      const btnFunction = button.dataset.function;
      if (btnFunction === "toggleDoneTodo") toggleDoneTodo(todoItem.id);
      else if (btnFunction === "deleteTodo") deleteTodo(todoItem.id);
    }
  }
}

//=================================================/
//-----------------MORE FUNCTIONS -----------------/
//=================================================/

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
  cutoffElement = document.body.parentElement
) {
  //*** The 'cutoffElement', if provided, will constrain the pathEls to a smaller array
  //that is closer to the clicked element (NOT inclusive of cutoffElement)
  const cutoffElement_index = pathEls.findIndex(
    (pathEl) => pathEl === cutoffElement
  );
  const cannotFindCutoffElementInPath = !(cutoffElement_index >= 0);
  if (cannotFindCutoffElementInPath) {
    console.error("Failed to find cutoffElement in path:", cutoffElement);
    return;
  }
  pathEls = pathEls.slice(0, cutoffElement_index);
  //✔️ pathEls has been shortened

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

function toggleDoneTodo(todoId) {
  //inverse todo.done value of specific todo
  const todos = getTodos().map((todo) => {
    if (todo.id === todoId) todo.done = !todo.done;
    return todo;
  });
  save_display_todos(todos);
}

function deleteTodo(todoId) {
  const todos = getTodos().filter((todo) => todo.id !== todoId);
  save_display_todos(todos);
}

function save_display_todos(todos) {
  saveTodos(todos);
  displayTodos(todos);
}

function displayTodos(todoObjs) {
  //map through todo objects to create HTML
  const todosStr = todoObjs
    .map((todo) => {
      return `
      <li class="todo-item ${todo.done ? "done" : ""}" id="${todo.id}">
         ${todo.text}
         <button class="done-todo-btn" data-function="toggleDoneTodo">Done</button>
         <button class="delete-todo-btn" data-function="deleteTodo">Delete</button>
      </li>`;
    })
    .join("");
  todoList.innerHTML = todosStr; //display todos
}

function getTodos() {
  return JSON.parse(localStorage.getItem("todos")) || [];
}

function saveTodos(todoObjs) {
  localStorage.setItem("todos", JSON.stringify(todoObjs));
}

function getRandomString() {
  return Math.random()
    .toString()
    .match(/[0-9]{2,}/)[0];
}
