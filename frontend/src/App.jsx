import { useThemeStore } from "./store/themeStore";

function App() {
  const { theme } = useThemeStore();
  return (
    <div data-theme={theme}>
      <Routes>
        <Route path="/dashboard" />
      </Routes>
    </div>
  );
}

export default App;
