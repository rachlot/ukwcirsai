import { useRecordContext, useResourceContext } from "ra-core"
import { Link, Edit, Button, ReferenceField, TextField, DateField, FunctionField, ReferenceArrayField } from "ra-ui-materialui"
import { util } from "../api/Util"
import { Schema } from "../model/schema"
import { helper } from "./helper"
import React, { useState } from "react"
import Dialog from '@mui/material/Dialog';
import { DiffViewer } from "./Diff"
import { EditForm } from "../form/EditForm"
import { SaveContextProvider } from 'react-admin';

/**
 * renders a single field in a table
 */
export const Field = ({ schema, source, pks }: {

    /**
     * schema underlying the column 
     */
    schema: Schema,

    /**
     * property name (in case schema.name is undefined)
     * do not rename since DataGrid requires source or label to determine the column name
     */
    source: string,

    pks?: string[]

    /**
     * not used here, but having the attribute in the DOM, sets the column header label
     */
    label: string
}) => {

    // help dialog open state
    const [help, setHelp] = useState(false)

    const record = useRecordContext()
    const data = record[source]
    const resource = useResourceContext()

    // handle display logic regarding url / imp links
    const tmp = helper(data)
    if (tmp)
        return tmp

    // if a col is both ref and pk, prioritize ref
    if (schema.ref) {
        const x = util.parseColumnID(schema.ref)

        // make sure this is not table metadata
        if (x.database !== 'config' || x.table !== 'Property')
            return <ReferenceField source={source} reference={util.toResource(x)} />
    }

    if (schema.pkpos === 0) {
        const x = util.parseColumnID(schema.ID!)

        if (x.database === 'config' && x.table === 'Table')
            return <Link to={'/' + util.parseTableID(data).database + '/' + encodeURIComponent(util.parseTableID(data).table)}>{data}</Link>

        if (pks && pks.length > 1)
            return <Link to={'/' + resource + '/' + pks.map(k => record[k]).join('_')}>{data}</Link>
        else
            if (resource.includes('#'))
                return <Link to={'/' + resource.replaceAll('#', '%23') + '/' + encodeURIComponent(data)}>{'#' + data}</Link>
            else
                return <ReferenceField source={source} reference={util.toResource(x)} />
    }

    if (schema.type === 'array' && schema.items?.ref)
        return <ReferenceArrayField source={source} reference={util.toResource(util.parseColumnID(schema.items.ref))} />

    // legacy handling of URL columns with href value
    if (schema?.name === 'url' && typeof data === 'string' && (data.startsWith('/page') || data.startsWith('/resource') || data.startsWith('/table')))
        return <Link to={data}>{data}</Link>

    if (schema.widget === 'date')
        return <DateField source={source} />

    if (schema.widget === 'datetime')
        return <DateField source={source} showTime={true} />

    return <>
        {
            util.isObject(data) || util.isTable(data) ? <FunctionField render={() => JSON.stringify(data, null, 2)} source={source} onClick={() => {
                setHelp(true)
            }} /> : <TextField source={source} onClick={() => {
                if (typeof data === 'object' || Array.isArray(data) || (typeof data === 'string' && data?.length > 40) || (typeof data === 'string' && data?.startsWith('diff --git ')))
                    setHelp(true)
            }} />
        }
        <Dialog open={help} onClose={() => setHelp(false)} maxWidth={false}>
            {typeof data === 'string' && data?.startsWith('diff --git ') ? <DiffViewer diffText={data} /> : <pre>
                {typeof data === 'string' ? data : JSON.stringify(data, null, 2)}
            </pre>}

        </Dialog>
    </>
}

/**
 * renders a button in a table that opens an edit dialog
 */
export const EditRowField = ({ schema }: { schema: Schema }) => {
    const [help, setHelp] = useState(false)
    const value = useRecordContext()
    return <>
        <Dialog open={help} onClose={() => setHelp(false)} maxWidth={false}>
            <Edit id={value.id} redirect={false}>
                <EditForm schema={schema}>{[]}</EditForm>
            </Edit>
        </Dialog>
        <Button label="Edit" onClick={() => setHelp(true)}></Button>
    </>
}