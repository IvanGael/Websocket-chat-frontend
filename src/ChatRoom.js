import React, { useState, useEffect, useRef } from 'react';
import {
    AppBar, Toolbar, Box, TextField, Button, Typography, Avatar, Paper, List, ListItem, ListItemText,
    ListItemAvatar, Backdrop, CircularProgress, Snackbar, IconButton, Slide, Grid, stack, Divider, useMediaQuery, useTheme
} from '@mui/material';
import { Stack, styled } from '@mui/system';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import NoChattingImg from './assets/no-chatting.png';
import Grid4x4Icon from '@mui/icons-material/Grid4x4';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import TollIcon from '@mui/icons-material/Toll';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import config from './config';


// Styles
const StyledPaper = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(3),
    height: '90vh',
    display: 'flex',
    flexDirection: 'column',
    // boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)'
}));

const ChatWindow = styled(Box)(({ theme }) => ({
    flexGrow: 1,
    overflowY: 'auto',
    marginBottom: theme.spacing(2),
    height: 'calc(90vh - 200px)',
    display: 'flex',
    flexDirection: 'column',
}));

const InputArea = styled(Box)(({ theme }) => ({
    display: 'flex',
    gap: theme.spacing(1),
    padding: theme.spacing(2, 0),
    alignItems: 'center',
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.shape.borderRadius,
}));

const MessageItem = styled(ListItem)(({ theme, isCurrentUser }) => ({
    alignSelf: isCurrentUser ? 'flex-end' : 'flex-start',
    borderColor: isCurrentUser ? theme.palette.primary.light : theme.palette.grey[200],
    borderStyle: 'solid',
    borderWidth: 1,
    borderRadius: 15,
    padding: theme.spacing(1.5),
    marginBottom: theme.spacing(1),
    maxWidth: '100%',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
}));

const ChatRoom = () => {
    const appTheme = useTheme();
    const isSmallScreen = useMediaQuery(appTheme.breakpoints.down('sm'));

    const [message, setMessage] = useState("");
    const [username, setUsername] = useState("");
    const [chat, setChat] = useState([]);
    const [ws, setWs] = useState(null);
    const [showPicker, setShowPicker] = useState(false);
    const [isConnecting, setIsConnecting] = useState(true);
    const [userCount, setUserCount] = useState(0);
    const [roomId, setRoomId] = useState("");
    const [showSnackbar, setShowSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [joinRoomId, setJoinRoomId] = useState("");
    const messageRef = useRef(null);
    const chatWindowRef = useRef(null);
    const [typingUsers, setTypingUsers] = useState({});
    const typingTimeoutRef = useRef({});

    useEffect(() => {
        createRoom();

        return () => {
            if (ws) ws.close();
        };
    }, []);

    useEffect(() => {
        if (roomId) {
            connectWebSocket(roomId);
        }
    }, [roomId]);

    useEffect(() => {
        if (chatWindowRef.current) {
            chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
        }
    }, [chat]);

    const createRoom = async () => {
        try {
            const response = await fetch(`${config.baseURL2}/create-room`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Room creation failed');
            }

            const data = await response.json();
            setRoomId(data.roomID);
        } catch (error) {
            setSnackbarMessage('An unexpected error appear while attempting to connect with the room. Please try again.');
            setShowSnackbar(true);
        }
    };

    const joinRoom = () => {
        if (joinRoomId.trim()) {
            if(!isValidRoomID(joinRoomId)){
                setSnackbarMessage("Invalid Room ID. Couldn't connect!");
                setShowSnackbar(true);
            } else {
                setRoomId(joinRoomId);
            }
        }
    };

    const isValidRoomID = (id) => {
        const pattern = /^[a-z]{3}-[a-z]{4}-[a-z]{3}\?hs=[1-9]\d{2}$/;
        return pattern.test(id);
    }    

    const connectWebSocket = (roomId) => {
        const socket = new WebSocket(`${config.baseURL}/ws?room=${roomId}`);

        socket.onopen = () => {
            setIsConnecting(false);
            setSnackbarMessage('Connected to chat room.');
            setShowSnackbar(true);
        };

        socket.onmessage = async function (event) {
            const messageData = JSON.parse(event.data);

            if (messageData.type === 'user_count') {
                const response = await fetch(`${config.baseURL2}/decrypt`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ message: messageData.message }),
                });

                const data = await response.json();
                setUserCount(parseInt(data.decrypted));
            } else if (messageData.type === 'typing') {
                setTypingUsers(prev => ({
                    ...prev,
                    [messageData.username]: messageData.typing
                }));
            }
            // else if (messageData.type === 'join') {
            //     setSnackbarMessage(`${messageData.username} has joined the room.`);
            //     setShowSnackbar(true);
            // } else if (messageData.type === 'leave') {
            //     setSnackbarMessage(`${messageData.username} has left the room.`);
            //     setShowSnackbar(true);
            // } 
            else {
                const response = await fetch(`${config.baseURL2}/decrypt`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ message: messageData.message }),
                });

                setUsername(messageData.username);
                const data = await response.json();
                setChat(prevChat => [...prevChat, { ...messageData, message: data.decrypted }]);
            }
        };

        socket.onclose = () => {
            setIsConnecting(true);
            setSnackbarMessage('Disconnected from chat room. Attempting to reconnect...');
            setShowSnackbar(true);
        };

        setWs(socket);
    };

    const sendMessage = async () => {
        const response = await fetch(`${config.baseURL2}/encrypt`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message }),
        });

        const data = await response.json();
        const encryptedMessage = data.encrypted;

        const msg = {
            type: 'chat',
            message: encryptedMessage,
        };
        ws.send(JSON.stringify(msg));
        setMessage("");
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const addEmoji = (emoji) => {
        setMessage(prevMessage => prevMessage + emoji.native);
        setShowPicker(false);
    };

    const handleTyping = () => {
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'typing', typing: true }));

            if (typingTimeoutRef.current[username]) {
                clearTimeout(typingTimeoutRef.current[username]);
            }

            typingTimeoutRef.current[username] = setTimeout(() => {
                ws.send(JSON.stringify({ type: 'typing', typing: false }));
            }, 3000);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text)
            .then(() => {
                setSnackbarMessage('Room ID successfully copied to the clipboard.');
                setShowSnackbar(true);
            });
    }

    return (
        <>
            <AppBar position="fixed">
                <Toolbar
                    variant="dense"
                    sx={{
                        flexDirection: isSmallScreen ? 'column' : 'row',
                        alignItems: 'center',
                        py: isSmallScreen ? 2 : 0,
                    }}
                >
                    <Typography
                        fontSize={25}
                        variant="h6"
                        sx={{
                            flexGrow: isSmallScreen ? 0 : 1,
                            color: 'white',
                            mb: isSmallScreen ? 1 : 0,
                        }}
                    >
                        Chat
                    </Typography>

                    <Stack
                        direction={isSmallScreen ? 'column' : 'row'}
                        spacing={isSmallScreen ? 1 : 2}
                        alignItems="center"
                    >
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <Typography variant="body2" fontWeight="bold" sx={{ color: 'white' }}>
                                [Room ID] :
                            </Typography>
                            <Grid4x4Icon sx={{ color: 'white' }} />
                            <Typography variant="body2" fontWeight="bold" sx={{ color: 'white' }}>
                                {roomId}
                            </Typography>
                            <IconButton onClick={() => copyToClipboard(roomId)} size="small">
                                <ContentCopyIcon fontSize="small" />
                            </IconButton>
                        </Stack>

                        {!isSmallScreen && (
                            <Typography variant="body2" fontWeight="bold" sx={{ color: 'white' }}>
                                |
                            </Typography>
                        )}

                        <Typography variant="body2" fontWeight="bold" sx={{ color: 'white' }}>
                            <Stack direction={'row'} spacing={1}>
                                <TollIcon sx={{ color: 'white' }} />
                                <Typography variant="body2" fontWeight="bold" sx={{ color: 'white' }}>
                                    :  {userCount}
                                </Typography>
                            </Stack>
                        </Typography>
                    </Stack>
                </Toolbar>
            </AppBar>

            <StyledPaper elevation={0} sx={{ mt: isSmallScreen ? 15 : 6 }}>
                <Grid container spacing={2} mt={2}>

                    <Grid item xs={12} sm={4}>
                        <TextField
                            fullWidth
                            label="Enter room ID"
                            variant="outlined"
                            value={joinRoomId}
                            onChange={(e) => setJoinRoomId(e.target.value)}
                            sx={{ mb: 2 }}
                        />
                        <Button variant="contained" color="primary" fullWidth onClick={joinRoom}>
                            <Typography fontSize={14} fontWeight={'bold'}>Join Room</Typography>
                        </Button>
                    </Grid>

                    <Grid item xs={12} sm={8} display="flex" flexDirection="column">
                        <Box
                            sx={{
                                borderStyle: 'dashed',
                                borderColor: 'black',
                                borderWidth: 2,
                                padding: '20px',
                                display: 'flex',
                                flexDirection: 'column',
                                height: 'calc(90vh - 100px)',
                            }}
                        >
                            <ChatWindow >
                                {chat.length !== 0 ? (
                                    <>
                                        <List sx={{ flexGrow: 1, overflowY: 'auto' }} ref={chatWindowRef}>
                                            {chat.map((msg, index) => (
                                                <MessageItem key={index} isCurrentUser={msg.username === username}>
                                                    <ListItemAvatar>
                                                        {/* <Avatar style={{ backgroundColor: msg.color, color: 'white' }}>
                                                            {msg.username.charAt(0)}
                                                        </Avatar> */}
                                                        <Avatar src={`https://api.dicebear.com/9.x/pixel-art/svg?seed=${msg.username}`} />
                                                    </ListItemAvatar>
                                                    <ListItemText
                                                        primary={
                                                            <>
                                                                <Typography component="span" variant="body1" fontWeight="bold">
                                                                    {msg.username}
                                                                </Typography>
                                                                <Typography component="span" variant="caption" color="textSecondary" style={{ float: 'right' }}>
                                                                    {new Date(msg.timestamp).toLocaleTimeString()}
                                                                </Typography>
                                                            </>
                                                        }
                                                        secondary={msg.message}
                                                    />
                                                </MessageItem>
                                            ))}
                                        </List>
                                        <Box>
                                            {Object.entries(typingUsers)
                                                .filter(([user, isTyping]) => isTyping && user !== username)
                                                .map(([user]) => (
                                                    <Typography key={user} variant="caption" color="textSecondary">
                                                        {user} is typing...
                                                    </Typography>
                                                ))}
                                        </Box>
                                    </>
                                ) : (
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexGrow: 1 }}>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                            <img src={NoChattingImg} style={{ objectFit: 'cover', width: '120px', height: '120px' }} />
                                            <Typography fontSize={12}>Message bubbles will appear here</Typography>
                                        </Box>
                                    </Box>
                                )}
                            </ChatWindow>
                            <Divider />

                            <InputArea>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    color="secondary"
                                    sx={{ paddingY: '12px', paddingX: '0px' }}
                                    onClick={() => setShowPicker(val => !val)}
                                >
                                    <EmojiEmotionsIcon fontSize='small' />
                                </Button>

                                {showPicker && (
                                    <Box mt={2} sx={{ position: 'absolute', bottom: '80px', left: '20px', animation: 'fadeIn 0.3s ease-in-out' }}>
                                        <Picker data={data} onEmojiSelect={addEmoji} />
                                    </Box>
                                )}
                                <TextField
                                    fullWidth
                                    label="Type your message"
                                    variant="outlined"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    onKeyUp={handleTyping}
                                    inputRef={messageRef}
                                />
                                <IconButton
                                    size='medium'
                                    color="primary"
                                    aria-label="Send"
                                    sx={{
                                        borderColor: message === "" ? appTheme.palette.grey[200] : appTheme.palette.primary.main,
                                        borderStyle: 'solid',
                                        borderWidth: 2
                                    }}
                                    onClick={sendMessage}
                                    disabled={message === ""}
                                >
                                    <SendIcon />
                                </IconButton>
                            </InputArea>
                        </Box>
                    </Grid>
                </Grid>

                <Snackbar
                    anchorOrigin={{ vertical: 'top', horizontal: 'center' }} // Moved to top-center
                    open={showSnackbar}
                    autoHideDuration={2000}
                    TransitionComponent={Slide}
                    onClose={() => setShowSnackbar(false)}
                    message={snackbarMessage}
                    action={
                        <IconButton size="small" color="inherit" onClick={() => setShowSnackbar(false)}>
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    }
                />

                {isConnecting && (
                    <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1, backgroundColor: 'rgba(0, 0, 0, 0.5)' }} open={isConnecting}>
                        <Box display="flex" flexDirection="column" alignItems="center">
                            <CircularProgress color="inherit" />
                            <Typography variant="h6" style={{ marginTop: 16 }}>
                                Connecting to chat room...
                            </Typography>
                        </Box>
                    </Backdrop>
                )}
            </StyledPaper>
        </>
    );
};

export default ChatRoom;
