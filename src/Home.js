import React, { useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { Box, keyframes } from '@mui/system';
import { Typography, Stack } from '@mui/material';
import ChatImg from './assets/chat.png';

const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const Home = () => {
    const navigate = useNavigate();

    useEffect(() => {
        setTimeout(() => {
            navigate('/chat')
        }, 5000);
    }, [])

    return (
        <Box
            sx={{
                height: '100vh',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                bgcolor: 'white',
            }}
        >
            <Stack direction={'column'} spacing={2}>
                <Box
                    component="img"
                    src={ChatImg}
                    alt="Chat Icon"
                    sx={{
                        width: 100,
                        height: 100,
                        animation: `${rotate} 6s linear infinite`,
                    }}
                />
                <Typography variant="subtitle2" fontWeight={'bold'} >
                    Just in a few seconds
                </Typography>
            </Stack>
        </Box>
    );
};

export default Home;