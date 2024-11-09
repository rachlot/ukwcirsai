import { Icon, Paper, Button as B, Box } from "@mui/material";
import { RecordContext, useDataProvider, useNotify, useRefresh } from "ra-core";
import { useNavigate } from "react-router";
import { deleteConfirmation, expression, print, text, title } from "../api/Const";
import { EditForm } from "../form/EditForm";
import { useExpressionContext } from "../hooks/useExpressionContext";
import { Widget } from "../model/widget";
import { util } from "../api/Util";
import { action } from "../api/Action";
import { useLoc } from "../hooks/useLoc";
import { useExpression } from "../hooks/useExpression";
import { Loading } from "react-admin";
import { PrintError } from "../components/PrintError";
import { createContext, useState } from "react";
import { SaveContextProvider } from 'react-admin';

/**
 * Button with an optional form that triggers an action
 */
export const Button = ({ widget, children }: { widget: Widget, children: any }) => {

    const { data, isLoading, error } = useExpression(widget.cached!, widget.expression)
    const schemaExpression = useExpression(widget.cached!, (widget as any).schemaExpression)

    if (isLoading || schemaExpression.isLoading) return <Loading />
    if (error || schemaExpression.error) return <PrintError error={error}></PrintError>

    if (schemaExpression.data)
        widget = { ...widget, schema: schemaExpression.data }

    return <ButtonInner value={data} widget={widget}>{children}</ButtonInner>
}

/**
 * context to indicate whether button is disabled
 */
export const DisabledContext = createContext<boolean>(false)

export const ButtonInner = ({ widget, children, value }: { widget: Widget, children: any, value: any }) => {
    // schema of the record we create
    let schema = widget.schema
    const dataProvider = useDataProvider()
    const navigate = useNavigate()
    const notify = useNotify()
    const refresh = useRefresh()
    const context = useExpressionContext()
    const loc = useLoc()

    const [disabled, setDisabled] = useState(false)

    const [form, setForm] = useState(value ? value : {})

    const onSubmit = async (data: any) => {
        data = util.handleDots(data)
        data = util.handleKeyValue(data)
        const expression = widget.print ? widget.print : widget.navigate
        if (!expression)
            return
        context.form = data
        try {
            setDisabled(true)
            if (loc.table === 'dj-function')
                if (widget.print === '$call(pk1)')
                    notify('Starting...')
            const res = action.isAction(expression) ? await dataProvider.action(expression, context, notify, refresh, navigate) : await dataProvider.expression(expression, context)

            if (widget.navigate) {
                if (typeof res === 'string')
                    if (res.startsWith('http'))
                        window.location.href = res
                    else
                        navigate(res)
            } else {
                if (!expression.includes('$notify('))
                    notify(util.isValue(res) ? util.stringify(res) : 'Ok')
            }
        }
        catch (err) {
            notify(util.error(err), { type: 'error' })
        }
        finally {
            setDisabled(false)
        }
    }

    const onSubmitConf = (data: any) => {
        if (widget.deleteConfirmation) {
            if (window.confirm(widget.deleteConfirmation))
                onSubmit(data)
        } else
            onSubmit(data)
    }

    // there are no input parameters, simply show a button to avoid a blank white line
    if (!schema && !children)
        return <Box sx={{ alignItems: 'start', marginBottom: '10px' }}>
            <B disabled={disabled} variant="contained" onClick={() => onSubmitConf({})}>{widget.text ? widget.text : 'Run'}</B>
        </Box>

    return <RecordContext.Provider value={form}>
        <Paper sx={{ height: '350px', marginLeft: '-22px', marginBottom: '10px', backgroundColor: 'transparent', borderColor: 'transparent', boxShadow: "none"}}>
            <DisabledContext.Provider value={disabled}>
                <SaveContextProvider value={{ save: onSubmitConf, saving: false, mutationMode: 'pessimistic' }}>

                    <EditForm schema={schema} label={widget.text ? widget.text : 'Run'}>{children}</EditForm>
                </SaveContextProvider>
            </DisabledContext.Provider>
        </Paper>
    </RecordContext.Provider >
}

export default Button

export const config = {
    id: 'button',
    title: 'Button',
    description: 'Perform an action with optional form input',
    version: 1,
    icon: <Icon>smart_button</Icon>,
    controls: {
        type: 'autoform',
        schema: {
            properties: {
                title: title,
                text: text,
                expression: expression,
                print: print,
                // deleteConfirmation: deleteConfirmation,
            }
        }
    }
}