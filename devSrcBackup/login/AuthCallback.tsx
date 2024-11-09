import * as React from 'react';
import { useHandleAuthCallback, useTimeout } from 'ra-core';
import { AuthErrorProps, Button, Loading } from 'react-admin';
import authProvider from './AuthProvider';
import { styled } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';

/**
 * A standalone page to be used in a route called by external authentication services (e.g. OpenID, OAuth)
 * after the user has been authenticated.
 *
 * Adapt this component to implement your own login logic
 * (e.g. to show a different waiting screen, start onboarding procedures, etc.).
 */
const AuthCallback = (props: AuthErrorProps & { button?: string }) => {
    const {
        className,
        title = "Login failed",
        message = "Reason:",
        button = "Login",
        ...rest
    } = props;

    const { error } = useHandleAuthCallback();
    const hasOneSecondPassed = useTimeout(1000);

    if (error) {

        let _error = authProvider.sanitizeError(error);

        let errorMsg = "Unknown error";
        if (_error instanceof Error)
            errorMsg = _error.message;

        // Clicking will log out the session - when we get an OAuth callback and it fails (for example: Dashjoin backend down)
        // this will bring us back to the login page

        return (

            <Root className={className} {...rest}>
                <div className={AuthErrorClasses.message}>
                    <h1>{title}</h1>
                    <div>{message}</div>
                    <div>{errorMsg}</div>
                    <br />
                    <Button label={button} to="/login" onClick={() => {
                        console.log("logging out session"); authProvider.logout();
                        // Get rid of OpenID callback parameters in URL:
                        window.location.href = window.location.origin;
                    }}>
                        <LockIcon />
                    </Button>
                </div>
            </Root>

        );
    }

    return hasOneSecondPassed ? <Loading /> : null;
};


const PREFIX = 'RaAuthError';

export const AuthErrorClasses = {
    root: `${PREFIX}-root`,
    message: `${PREFIX}-message`,
};

const Root = styled('div', {
    name: PREFIX,
    overridesResolver: (props, styles) => styles.root,
})(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    [theme.breakpoints.up('md')]: {
        height: '100%',
    },
    [theme.breakpoints.down('xl')]: {
        height: '100vh',
        marginTop: '-3em',
    },

    [`& .${AuthErrorClasses.message}`]: {
        textAlign: 'center',
        fontFamily: 'Roboto, sans-serif',
        opacity: 0.5,
        margin: '0 1em',
    },
}));

export default AuthCallback;
