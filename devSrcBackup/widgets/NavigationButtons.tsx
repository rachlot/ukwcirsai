import { Card as C, Button, Icon, Typography } from "@mui/material";
import { Widget } from "../model/widget";
import Container from "./Container";
import { roles, text, title } from "../api/Const";
import React, { useState } from "react";
import Image from "next/image";
import { profile } from "../api/Profile";
import { useRefresh } from "react-admin";
import { ThemeProvider } from '@mui/material/styles';
import defaultTheme from '../styles/theme/defaultTheme'
/**
 * draw card and title and delegate to container
 */
function NavigationButtons({ widget, children }: { widget: Widget, children: any }) {
    const refresh = useRefresh()

    const [step, setStep] = useState(parseInt(profile.getVariable().step));


    function takeStep(forward=true){
        const next = forward ? step+1 : step-1
        const variable = {
            "step": next.toString(),
            "cirs": profile.getVariable().cirs
        }
        //setStep(next);
        profile.setVariable(variable);
        refresh();
    }
    
  

    return (
        <div style={styles.container}>
            <ThemeProvider theme={defaultTheme}>
            {step === 6 && <Button color="primary" variant="outlined" style={{borderRadius: '20px', marginRight: '136px', marginTop: '-52px', height: '38px'}} onClick={() => takeStep(false)}>Zurück</Button>}

             {step > 1 && step < 6 && <Button color="primary" variant="outlined" style={{borderRadius: '20px'}} onClick={() => takeStep(false)}>Zurück</Button>}
            {step < 6 && <Button variant="contained" style={{borderRadius: '20px'}}  onClick={() => takeStep(true)}>Weiter</Button>}
            </ThemeProvider>
        </div>);
    
}


const styles={
    container: {
        display: 'flex',
        gap: '16px',
        justifyContent: 'flex-end',
    },
    outlinedButton: {
        borderColor: "red"
    }
}

export default NavigationButtons

export const NavigationButtonsConfig = {
    id: 'navigationButtons',
    title: 'NavigationButtons',
    description: 'Home container',
    version: 1,
    icon: <Icon>badge</Icon>,
    controls: {
        type: 'autoform',
        schema: {
            properties: {
                title: title,
                roles: roles,
                text: text
            }
        }
    }
}