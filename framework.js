// Create Virtual Element
function createElement(type, props = {}, ...children) {
  const flatChildren = children.flat();
  const processedChildren = [];
  let textBuffer = "";

  flatChildren.forEach((child) => {
    if (typeof child === "string" || typeof child === "number") {
      textBuffer += child;
    } else {
      if (textBuffer) {
        processedChildren.push(textBuffer);
        textBuffer = "";
      }
      processedChildren.push(child);
    }
  });

  if (textBuffer) {
    processedChildren.push(textBuffer);
  }

  return {
    type,
    props,
    children: processedChildren,
  };
}

// Render Virtual Element to Real DOM
function render(vElement) {
  // Handle strings and numbers by converting them to text nodes
  if (typeof vElement === "string" || typeof vElement === "number") {
    return document.createTextNode(vElement);
  }

  // Ensure vElement is an object with type and props
  if (!vElement || typeof vElement !== "object" || !vElement.type) {
    throw new Error("Invalid virtual element:", vElement);
  }

  // Create the actual DOM element
  const dom = document.createElement(vElement.type);

  // Safely handle props
  const props = vElement.props || {};
  for (const [key, value] of Object.entries(props)) {
    if (key.startsWith("on") && typeof value === "function") {
      // Attach event listeners
      dom.addEventListener(key.substring(2).toLowerCase(), value);
    } else if (key === "className") {
      // Handle className separately
      dom.setAttribute("class", value);
    } else {
      // Set other attributes
      dom.setAttribute(key, value);
    }
  }

  // Recursively render and append children
  vElement.children.forEach((child) => dom.appendChild(render(child)));

  return dom;
}

// Diffing Algorithm
function diff(oldVElement, newVElement) {
  if (!oldVElement) {
    return { type: "CREATE", newVElement };
  }

  if (!newVElement) {
    return { type: "REMOVE" };
  }

  if (
    typeof oldVElement !== typeof newVElement ||
    (typeof oldVElement === "string" && oldVElement !== newVElement) ||
    oldVElement.type !== newVElement.type
  ) {
    return { type: "REPLACE", newVElement };
  }

  if (typeof oldVElement === "string" && oldVElement === newVElement) {
    return null;
  }

  if (oldVElement.type) {
    const propDiffs = diffProps(oldVElement.props, newVElement.props);
    const childrenDiffs = diffChildren(oldVElement.children, newVElement.children);
    if (propDiffs.length === 0 && childrenDiffs.every((patch) => patch === null)) {
      return null;
    }
    return {
      type: "UPDATE",
      props: propDiffs,
      children: childrenDiffs,
    };
  }
}

function diffProps(oldProps, newProps) {
  const patches = [];

  for (const [key, value] of Object.entries(newProps)) {
    if (oldProps[key] !== value) {
      patches.push({ key, value });
    }
  }

  for (const key in oldProps) {
    if (!(key in newProps)) {
      patches.push({ key, value: undefined });
    }
  }

  return patches;
}

function diffChildren(oldChildren, newChildren) {
  const patches = [];
  const max = Math.max(oldChildren.length, newChildren.length);
  for (let i = 0; i < max; i++) {
    patches[i] = diff(oldChildren[i], newChildren[i]);
  }
  return patches;
}

// Inside patch function
function patch(parent, patchObj, index = 0) {
  if (!patchObj) return;

  const child = parent.childNodes[index];

  switch (patchObj.type) {
    case "CREATE": {
      const newChild = render(patchObj.newVElement);
      console.log("Creating new element:", patchObj.newVElement);
      parent.appendChild(newChild);
      break;
    }
    case "REMOVE": {
      console.log("Removing element:", child);
      parent.removeChild(child);
      break;
    }
    case "REPLACE": {
      const newChild = render(patchObj.newVElement);
      console.log("Replacing element:", child, "with:", patchObj.newVElement);
      parent.replaceChild(newChild, child);
      break;
    }
    case "UPDATE": {
      console.log("Updating element:", child, "with props:", patchObj.props);
      // Update props
      patchProps(child, patchObj.props);
      // Update children
      patchChildren(child, patchObj.children);
      break;
    }
    default:
      break;
  }
}

// Attach an event listener and store the handler reference
function attachEvent(dom, key, value) {
  const eventType = key.substring(2).toLowerCase();
  dom.addEventListener(eventType, value);

  // Store the handler reference for future removal
  if (!dom._eventListeners) dom._eventListeners = {};
  dom._eventListeners[eventType] = value;
}

// Remove an event listener using the stored handler reference
function removeEvent(dom, key) {
  const eventType = key.substring(2).toLowerCase();
  if (dom._eventListeners && dom._eventListeners[eventType]) {
    dom.removeEventListener(eventType, dom._eventListeners[eventType]);
    delete dom._eventListeners[eventType];
  }
}

function patchProps(dom, props) {
  props.forEach(({ key, value }) => {
    if (value === undefined) {
      // Remove attribute
      dom.removeAttribute(key);

      // Remove event listener if it's an event
      if (key.startsWith("on") && typeof dom[key.toLowerCase()] === "function") {
        removeEvent(dom, key);
      }
    } else {
      if (key.startsWith("on") && typeof value === "function") {
        // Remove existing event listener
        removeEvent(dom, key);
        // Attach new event listener
        attachEvent(dom, key, value);
      } else if (key === "className") {
        dom.setAttribute("class", value);
      } else {
        dom.setAttribute(key, value);
      }
    }
  });
}

function patchChildren(dom, childrenPatches) {
  childrenPatches.forEach((patchObj, index) => {
    patch(dom, patchObj, index);
  });
}

// Simple Component System
function createComponent(renderFunction) {
  return function (props) {
    return renderFunction(props);
  };
}

// State Management with Proxy
function useState(initialState, renderCallback) {
  let state = initialState;

  const handler = {
    set(target, property, value) {
      target[property] = value;
      renderCallback(); // Trigger re-render on state change
      return true;
    },
    get(target, property) {
      return target[property];
    },
  };

  const proxyState = new Proxy(state, handler);
  return proxyState;
}

// Mounting the App
let oldVApp = null;
let rootDom = null;

function mount(vApp, container) {
  oldVApp = vApp;
  rootDom = render(vApp);
  container.appendChild(rootDom);
}

function updateApp(newVApp) {
  const patches = diff(oldVApp, newVApp);
  patch(rootDom.parentNode, patches, 0);
  oldVApp = newVApp;
}
