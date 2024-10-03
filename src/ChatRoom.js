import React, { useState, useEffect, useRef } from 'react';
import { Box, TextField, Button, Typography, Avatar, Paper, List, ListItem, ListItemText, ListItemAvatar, useTheme } from '@mui/material';
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
    const appTheme = useTheme()

    const [username, setUsername] = useState("");
    const [message, setMessage] = useState("");
    const [chat, setChat] = useState([]);
    const [typingUser, setTypingUser] = useState(null);
    const [ws, setWs] = useState(null);
    const [showPicker, setShowPicker] = useState(false);
    const messageRef = useRef(null);
    const chatWindowRef = useRef(null);

    useEffect(() => {
        const socket = new WebSocket(config.baseURL);

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

        setWs(socket);

        return () => {
            socket.close();
        };
    }, [username]);

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
        if (ws && message && username) {
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
        if (ws && username) {
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
                                {/* https://www.dicebear.com/how-to-use/http-api/ */}
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
                />
                <Button variant="contained" color="primary" onClick={sendMessage} endIcon={<SendIcon sx={{ color: 'white' }}/>}>
                    <Typography variant="button" sx={{ color: 'white' }}>
                        Send
                    </Typography>
                </Button>
                <Button variant="outlined" onClick={() => setShowPicker(!showPicker)}>
                    <EmojiEmotionsIcon />
                </Button>
            </InputArea>
            {showPicker && (
                <Box mt={2} sx={{position: 'absolute'}}>
                    <Picker data={data} onEmojiSelect={addEmoji} />
                </Box>
            )}
        </StyledPaper>
    );
};

export default ChatRoom;