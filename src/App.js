import { useState, useMemo } from "react";
import ChatRoom from "./ChatRoom";
import { ThemeProvider } from '@mui/material/styles';
import GetTheme from "./CustomTheme";
 
function App() {
  const [mode, setMode] = useState('light');

  // const toggleTheme = () => {
  //   setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  // };

  const theme = useMemo(
    () =>
      GetTheme(mode),
    [mode],
  );

  return (
    <ThemeProvider theme={theme}>
      <ChatRoom/>
    </ThemeProvider>
  );
}

export default App;
