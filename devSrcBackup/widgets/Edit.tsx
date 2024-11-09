import { useGetOne, useResourceContext } from "ra-core"
import { Edit as E, Loading } from "ra-ui-materialui"
import { EditForm } from "../form/EditForm"
import { useLoc } from "../hooks/useLoc"
import { useSchema } from "../hooks/useSchema"
import { Schema } from "../model/schema"
import { deleteConfirmation, noDelete, title } from "../api/Const"
import { Icon } from '@mui/material'
import { Widget } from "../model/widget"
import { util } from "../api/Util"
import { PrintError } from "../components/PrintError";

/**
 * Edit widget - switch for edit record / table
 */
export const Edit = ({ widget, children }: { widget: Widget, children: any }) => {
    const loc = useLoc()
    if (loc.type === 'table')
        return <EditTable widget={widget}></EditTable>
    else
        return <EditRecord widget={widget} >{children}</EditRecord>
}

/**
 * edit a "normal" data record
 */
const EditRecord = ({ widget, children }: { children: any, widget: Widget }) => {
    const loc = useLoc()
    const { data, isLoading, error } = useSchema();
    if (isLoading) return <Loading />
    if (error) return <PrintError error={error}></PrintError>
    const schema = util.defaultSchema(children, data)

    return <E sx={{ marginBottom: '10px' }} mutationMode={loc.database === 'config' ? 'pessimistic' : 'undoable'} redirect={util.getRedirect(widget.editRedirect)}>
        <EditForm widget={widget} schema={schema} label={widget.text ? widget.text : undefined} >{schema?.ID === 'dj/config/dj-function' || schema?.ID === 'dj/config/dj-database' || schema?.ID === 'dj/config/dj-config' ? [] : children}</EditForm>
    </E>
}

/**
 * edit table schema
 */
const EditTable = ({ widget }: { widget: Widget }) => {

    const [database, table] = util.parseResource(useResourceContext())
    const id = 'dj/' + database + '/' + util.encodeTableOrColumnName(table)

    const { data, isLoading, error } = useGetOne('config/Table', { id: 'dj/config/Table' });
    if (isLoading) return <Loading />
    if (error) return <PrintError error={error}></PrintError>
    const schema = data as Schema

    return <E sx={{ marginBottom: '10px' }} resource="config/Table" id={id} redirect={false}>
        <EditForm schema={schema} label={widget.text ? widget.text : undefined} >{[]}</EditForm>
    </E>
}

export default Edit

export const config = {
    id: 'edit',
    title: 'Edit',
    description: 'Edit the current record',
    version: 1,
    icon: <Icon>edit</Icon>,
    controls: {
        type: 'autoform',
        schema: {
            properties: {
                title: title,
                // deleteConfirmation: deleteConfirmation,
                noDelete: noDelete
            }
        }
    }
}