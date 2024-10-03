import { createTheme } from '@mui/material/styles';

const GetTheme = (mode) => {
    return createTheme({
        palette: {
            primary: {
                main: '#04BBFF',
            },
            secondary: {
                main: '#FE277E',
            },
            background: {
                default: '#692FA0'
            },
            mode: mode
        },
        typography: {
            fontFamily: [
                'Roboto',
                'Arial',
                'sans-serif',
            ].join(','),
        },
        shape: {
            borderRadius: 10
        },
        components: {
            MuiButton: {
                defaultProps: {
                    
                },
                styleOverrides: {
    
                }
            }
        }
    });
}

export default GetTheme;
