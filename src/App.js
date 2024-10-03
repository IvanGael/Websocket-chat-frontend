import { useState, useMemo } from "react";
import { Route, Routes } from 'react-router-dom';
import ChatRoom from "./ChatRoom";
import Home from "./Home";
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
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/chat' element={<ChatRoom />} />
      </Routes>
    </ThemeProvider>
  );
}

export default App;
