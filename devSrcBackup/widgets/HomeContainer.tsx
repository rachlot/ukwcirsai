import { Card as C, CardContent, Icon, Typography } from "@mui/material";
import { Widget } from "../model/widget";
import Container from "./Container";
import { roles, text, title } from "../api/Const";
import React from "react";
import Image from "next/image";
import type { Property } from 'csstype'
import { MobileFriendly } from '@mui/icons-material';

/**
 * draw card and title and delegate to container
 */
function HomeContainer({ widget, children }: { widget: Widget, children: any }) {
    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <Typography variant="h3">CIRS</Typography>
                <Typography variant="h5">Reports die Leben retten!</Typography>
            </div>
            <div style={styles.contentBox}>
                <div style={styles.textContainer}>
                 
                        <Typography variant="h5">Vorfälle anonym berichten & helfen       <MobileFriendly style={{marginBottom: '-4px'}}/></Typography>
                  
                  
                    <Typography variant="body2">Incidents, die in das CIRS (Critical Incidents Reporting System) eingetragen werden,{"\n"} sind anonym und können nicht mit der berichtenden Person in Verbindung{"\n"}  gebracht werden.</Typography>
                </div>
                <div style={styles.iconContainer}>
                    {<Image src="https://www.gymnasium-mengen.de/images/content/Aktuelles_2021-22/22-07_Portfolio.jpg" alt="logo" width='200' height='140'/>}
                </div>
            </div>
            <div style={{width: '1200px'}}>
            <Container widget={widget}>{children}</Container>
            </div>
        </div>);
    
}

const styles={
    container: {
        flex: 1,
        backgroundColor: "#F9EFF7",
        margin: '-50px',
        paddingTop: '2%',
        paddingLeft: '5%',
        paddingRight: '5%',
        paddingBottom: '2%',
        gap: '16px',
        verticalGap: '16px',
        display: "flex",
        flexDirection: 'column' as Property.FlexDirection,
        justifyContent: 'center',
        alignItems: 'center'
    },
    header:{
        gap: '16px',
        flexDirection: 'column' as Property.FlexDirection,
        padding: '24px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        width: '1200px'
    },
    contentBox: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: '24px 48px',
        borderRadius: '12px',
        gap: '16px',
        width: '1200px'
      },
      textContainer: {
        paddingRight: '20px',
        gap: '16px',
        flex: 1,
        display: "flex",
        flexDirection: 'column' as Property.FlexDirection 
      },
      textHeader: {
        gap: '8px',
        flexDirection: 'row' as Property.FlexDirection 
      },
      iconContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        display: 'flex'
      }
}

export default HomeContainer

export const HomeContainerConfig = {
    id: 'homeContainer',
    title: 'HomeContainer',
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