import React, { useState, useEffect, useRef } from 'react';
import { Box, TextField, Button, Typography, Avatar, Paper, List, ListItem, ListItemText, ListItemAvatar, useTheme, Backdrop, CircularProgress } from '@mui/material';
import { styled } from '@mui/system';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import SendIcon from '@mui/icons-material/Send';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import config from './config';

const StyledPaper = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(2),
    height: '95vh',
    display: 'flex',
    flexDirection: 'column',
}));

const ChatWindow = styled(Box)(({ theme }) => ({
    flexGrow: 1,
    overflowY: 'auto',
    marginBottom: theme.spacing(2),
}));

const InputArea = styled(Box)(({ theme }) => ({
    display: 'flex',
    gap: theme.spacing(1),
}));

const MessageItem = styled(ListItem)(({ theme, isCurrentUser, highlightColor }) => ({
    borderColor: isCurrentUser ? highlightColor : 'transparent',
    borderWidth: 2,
    borderStyle: 'solid',
    borderRadius: theme.shape.borderRadius,
}));

const ChatRoom = () => {
    const appTheme = useTheme();

    const [username, setUsername] = useState("");
    const [message, setMessage] = useState("");
    const [chat, setChat] = useState([]);
    const [typingUser, setTypingUser] = useState(null);
    const [ws, setWs] = useState(null);
    const [showPicker, setShowPicker] = useState(false);
    const [isConnecting, setIsConnecting] = useState(true);
    const messageRef = useRef(null);
    const chatWindowRef = useRef(null);

    useEffect(() => {
        const socket = new WebSocket(config.baseURL);

        socket.onopen = () => {
            setIsConnecting(false);
        };

        socket.onmessage = (event) => {
            const messageData = JSON.parse(event.data);

            if (messageData.typing && messageData.username !== username) {
                setTypingUser(messageData.username);
            } else if (!messageData.typing) {
                const formattedTimestamp = formatTimestamp(messageData.timestamp);
                setChat((prevChat) => [...prevChat, { ...messageData, timestamp: formattedTimestamp }]);
                setTypingUser(null);
            }
        };

        socket.onclose = () => {
            setIsConnecting(true);
        };

        setWs(socket);

        return () => {
            socket.close();
        };
    }, []);

    useEffect(() => {
        if (chatWindowRef.current) {
            chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
        }
    }, [chat]);

    const formatTimestamp = (isoString) => {
        const date = new Date(isoString);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    };

    const sendMessage = () => {
        if (ws && message && username && ws.readyState === WebSocket.OPEN) {
            const msg = { username, message, timestamp: new Date().toISOString(), typing: false };
            ws.send(JSON.stringify(msg));
            setMessage("");
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            sendMessage();
        }
    };

    const handleChange = (e) => {
        setMessage(e.target.value);
        if (ws && username && ws.readyState === WebSocket.OPEN) {
            const typingMessage = { username, message: "", timestamp: "", typing: true };
            ws.send(JSON.stringify(typingMessage));
        }
    };

    const addEmoji = (emoji) => {
        setMessage((prevMessage) => prevMessage + emoji.native);
        setShowPicker(false);
    };

    return (
        <StyledPaper elevation={3}>
            <Typography variant="h4" fontWeight={'bold'} gutterBottom>
                Chat
            </Typography>

            <TextField
                fullWidth
                variant="outlined"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                margin="normal"
                disabled={isConnecting}
            />

            <ChatWindow ref={chatWindowRef}>
                {typingUser && (
                    <Typography variant="body2" color="textSecondary">
                        {typingUser} is typing...
                    </Typography>
                )}
                <List>
                    {chat.map((msg, index) => (
                        <MessageItem key={index} alignItems="flex-start" isCurrentUser={msg.username === username} highlightColor={appTheme.palette.secondary.main}>
                            <ListItemAvatar>
                                <Avatar src={`https://api.dicebear.com/9.x/pixel-art/svg?seed=${msg.username}`} />
                            </ListItemAvatar>
                            <ListItemText
                                primary={
                                    <React.Fragment>
                                        <Typography component="span" variant="body1" fontWeight={'bold'} color='textPrimary'>
                                            {msg.username}
                                        </Typography>
                                        <Typography component="span" variant="caption" color="text.secondary" style={{ marginLeft: 8 }}>
                                            at {msg.timestamp}
                                        </Typography>
                                    </React.Fragment>
                                }
                                secondary={msg.message}
                            />
                        </MessageItem>
                    ))}
                </List>
            </ChatWindow>

            <InputArea>
                <TextField
                    inputRef={messageRef}
                    fullWidth
                    variant="outlined"
                    placeholder="Enter your message"
                    value={message}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    disabled={isConnecting}
                />
                <Button
                    variant="contained"
                    color="primary"
                    onClick={sendMessage}
                    // endIcon={<SendIcon sx={{ color: 'white' }}/>}
                    disabled={isConnecting}
                >
                    {/* <Typography variant="button" sx={{ color: 'white' }}>
                        Send
                    </Typography> */}
                    <SendIcon sx={{ color: 'white' }} />
                </Button>
                <Button variant="outlined" onClick={() => setShowPicker(!showPicker)} disabled={isConnecting}>
                    <EmojiEmotionsIcon />
                </Button>
            </InputArea>
            {showPicker && (
                <Box mt={2} sx={{ position: 'absolute' }}>
                    <Picker data={data} onEmojiSelect={addEmoji} />
                </Box>
            )}
            <Backdrop
                sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
                open={isConnecting}
            >
                <Box display="flex" flexDirection="column" alignItems="center">
                    <CircularProgress color="primary" />
                    <Typography variant="h6" style={{ marginTop: 16 }}>
                        Attempting to establish a connection with the server...
                    </Typography>
                </Box>
            </Backdrop>
        </StyledPaper>
    );
};

export default ChatRoom;