import { Loading } from "ra-ui-materialui";
import { useExpression } from "../hooks/useExpression";
import { Widget } from "../model/widget";
import Layout from "./Layout";
import { _if, header, redrawInterval, roles, subTitle, title } from "../api/Const";
import { Grid, Stack, Icon, Typography, LinearProgress } from '@mui/material'
import { PrintError } from "../components/PrintError";
import { useContext, useEffect, useReducer } from "react";
import { EditContext, ValueContext } from "../App";
import { useRefresh } from "ra-core";
import React from "react";
import type { Property } from 'csstype'
import { AddCircle , Check} from '@mui/icons-material';
import { ThemeProvider } from '@mui/material/styles';
import defaultTheme from '../styles/theme/defaultTheme'
import { profile } from "../api/Profile";
/**
 * container that draws kids as a list of layouts
 * also has the option of determining the display based on an expression
 * 
 * if the container is loaded via the editor, the widget.children prop
 * is removed and replaced with a grid layout (causing children to be set)
 * 
 * if the container is loaded from WidgetLoader, children is undefined
 * but widget.children is set (basically the WidetLoader is treated like one block)
 */
const Container = ({ widget, children }: { widget: Widget, children: any }) => {

    const edit = useContext(EditContext)
    const [, forceUpdate] = useReducer(x => x + 1, 0);
    const refresh = useRefresh()

    useEffect(() => {
        if (widget.redrawInterval) {
            const timer = setInterval(() => {
                refresh()
                forceUpdate()
            }, widget.redrawInterval * 1000)

            return () => clearInterval(timer)
        }
    }, [widget.redrawInterval]);

    useEffect(() => {
        const stepVar = profile.getVariable();
        if(stepVar.step === undefined){
            const variable = {
                "step": "1",
                "cirs": profile.getVariable().cirs
            }
            profile.setVariable(variable);
            refresh();
        }
    }, [refresh]);

    const { data, isLoading, error } = useExpression(widget.cached!, (widget as any).foreach)
    if (isLoading) return <Loading />
    if (error) return <PrintError error={error}></PrintError>

    // container without kids
    if (!children && !widget.children) return <></>

    let i = 0
    if (Array.isArray(data))
        return <Stack direction={(widget as any).layout === 'horizontal' ? 'row' : 'column'}
            useFlexGap
            sx={{ flexWrap: 'wrap' }}
            spacing={1}
        >{data.map(kid =>
            <ValueContext.Provider key={i++} value={kid}>
                {children}
            </ValueContext.Provider>
        )}</Stack>

        const icon = widget.header === "Jetzt berichten" ? <AddCircle style={{marginLeft: '8px', marginBottom: '-4px'}}/> : widget.title === undefined ? <></>:<Check style={{marginLeft: '8px', marginBottom: '-4px'}}/>
    if (children)
        return (<div style={styles.container}>
            <Typography variant="h5">{widget.header}{icon}</Typography>
            <Typography variant="body2">{widget.subTitle}</Typography>
            {widget.header && <div style={{width: '100', borderRadius: '20px'}}>
                <ThemeProvider theme={defaultTheme}>
                    <LinearProgress style={{borderRadius: '20px'}} variant='determinate' value={(parseInt(profile.getVariable().step)-1)*20} />
                </ThemeProvider>
            </div>}
            {children}
            </div>);
    else
        return <>{widget.children!.map(kid =>
            <Layout key={i++} widget={kid} compid={kid.widget!}></Layout>
        )}</>
}

const styles = {
    container: {
        padding: '0px 24px 24px 24px',
        borderRadius: '12px',
        backgroundColor: "#FFFFFF",
        gap: '16px',
        display: 'flex',
        flexDirection: 'column' as Property.FlexDirection 
    }
}

export default Container

/**
 * Metadata
 */
export const config = {
    id: 'container',

    // capitalized version
    title: 'Container',

    // description in widget chooser
    description: 'Groups other widgets',
    version: 1,
    icon: <Icon>table_chart</Icon>,
    controls: {
        type: 'autoform',
        schema: {
            properties: {
                title: title,
                header: header,
                subTitle: subTitle,
                if: _if,
                roles: roles,
                redrawInterval: redrawInterval
            },
        },
    }
}
