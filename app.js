// Initialize state
const state = useState({ count: 0 }, () => {
  const newVApp = App();
  updateApp(newVApp);
});

// Create a component
const App = createComponent((props) => {
  return createElement(
    "div",
    { id: "app", className: "container", style: { padding: "20px", border: "1px solid #ccc" } }, // Container div with id, class, and styles
    createElement("h1", { className: "title" }, "Hello, Virtual DOM!"),
    createElement("p", { id: "counter" }, `Count: ${state.count}`), // Added id
    createElement(
      "button",
      { onClick: () => state.count++, className: "btn" }, // Added className
      "Increment"
    )
    // createElement("div", { style: { color: "red", backgroundColor: "blue" } })
  );
});

// Initial render
const root = document.getElementById("root");
const initialVApp = App();
mount(initialVApp, root);
