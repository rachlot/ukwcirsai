import { Icon, Paper } from '@mui/material'
import { RecordContext, useRefresh } from "ra-core"
import { useState } from "react"
import { text, title } from "../api/Const"
import { EditForm } from "../form/EditForm"
import { Widget } from "../model/widget"
import { profile } from '../api/Profile'
import { util } from '../api/Util'
import { SaveContextProvider } from "react-admin"

/**
 * sets a session variable via a form
 */
function Variable({ widget, children }: { widget: Widget, children: any }) {

    const refresh = useRefresh()
    const [value, setValue] = useState(profile.getVariable())

    // schema of the variable
    let schema = widget.schema

    if (!schema)
        schema = { type: 'object', properties: {} }

    const onSubmit = (data: any) => {
        data = util.handleDots(data)
        data = util.handleKeyValue(data)
        profile.setVariable(data)
        setValue(data)
        refresh()
    }

    return <RecordContext.Provider value={value}>
        <Paper sx={{ marginBottom: '10px' }}>
            <SaveContextProvider value={{ save: onSubmit, saving: false, mutationMode: 'pessimistic' }}>
                <EditForm schema={schema} label={widget.text ? widget.text : 'Apply'}>{children}</EditForm>
            </SaveContextProvider>
        </Paper>
    </RecordContext.Provider >
}

export default Variable

export const config = {
    id: 'variable',
    title: 'Variable',
    description: 'Sets a session variable that can be used in queries and filters',
    version: 1,
    icon: <Icon>plus_one</Icon>,
    controls: {
        type: 'autoform',
        schema: {
            properties: {
                title: title,
                text: text
            }
        }
    }
}
