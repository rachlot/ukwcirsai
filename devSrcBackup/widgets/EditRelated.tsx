import { Icon } from '@mui/material'
import { BulkDeleteButton, Create, Datagrid, Edit, Loading, ReferenceManyField, SimpleForm, useGetOne, useResourceContext } from 'react-admin'
import { columns, prop, title } from '../api/Const'
import { util } from '../api/Util'
import { EditRowField, Field } from '../components/Field'
import { useLoc } from '../hooks/useLoc'
import { Widget } from '../model/widget'
import { EditForm } from '../form/EditForm'
import { PrintError } from "../components/PrintError";
import Box from '@mui/material/Box';
import { Schema } from '../model/schema'

/**
 * edit related widget
 * 
 * displays a table with related records with a create form and an edit form for each row
 * other than edit, create, variable or button, we do not support editing the forms via the layout editor
 * via the layout editor, we can set columns (table and edit form column) and
 * createColumns (the fields included in the form)
 */
export const EditRelated = ({ widget }: { widget: Widget }) => {
    const loc = useLoc()
    if (loc.type !== 'resource' && loc.type !== 'table')
        return <p>The EditRelated widget can only be used on record pages</p>
    if (!widget.prop)
        return <p>EditRelated: please provide the property that relates the children to this record</p>
    else
        return <EditRelated2 widget={widget}></EditRelated2>
}

export const EditRelated2 = ({ widget }: { widget: Widget }) => {
    const prop = util.parseColumnID(widget.prop!)

    const loc = useLoc()

    const [database, table] = util.parseResource(useResourceContext())
    const id = 'dj/' + database + '/' + util.encodeTableOrColumnName(table)

    const { data, isLoading, error } = useGetOne('config/Table', { id: 'dj/' + prop.database + '/' + util.encodeTableOrColumnName(prop.table) });
    if (isLoading) return <Loading />
    if (error) return <PrintError error={error}></PrintError>

    // schema for the table and edit form
    let tableSchema: Schema = JSON.parse(JSON.stringify((data)))

    if (widget.columns) {
        tableSchema = { type: 'object', properties: {} }
        for (const col of widget.columns)
            tableSchema.properties![col] = data.properties[col] ? data.properties[col] : { type: 'string' }
    }

    // schema for the create form
    let schema: Schema = JSON.parse(JSON.stringify((tableSchema)))

    // special case for column table metadata
    if (loc.type === 'table')
        schema = { type: 'object', properties: { name: { required: true, ...data.properties.name }, type: { required: true, ...data.properties.type } } }

    // special case for create table on database
    if (loc.database === 'config' && loc.table === 'dj-database')
        schema = { type: 'object', properties: { name: { required: true, ...data.properties.name } } }

    // remove FK since it's set automatically in the transform callback
    if (schema?.properties)
        delete schema.properties[prop.property]
    if (tableSchema?.properties)
        delete tableSchema.properties[prop.property]

    let i = 0
    const edit = <ReferenceManyField reference={util.toResource(prop)} target={prop.property}>
        <Datagrid
            sx={{
                "& .RaDatagrid-rowCell": {
                    whiteSpace: "nowrap",
                    maxWidth: '300px',
                    overflowX: 'hidden'
                },
                "& .RaDatagrid-headerCell": {
                    whiteSpace: "nowrap",
                },
            }}
            bulkActionButtons={prop.database === 'config' && (prop.table === 'Table' || prop.table === 'Property') ? <BulkDeleteButton mutationMode="pessimistic" /> : undefined}  >
            {Object.entries(tableSchema?.properties ? tableSchema.properties : {}).map(([k, v]) => <Field key={i++} label={k} source={k} schema={v} />)}
            <EditRowField schema={tableSchema}></EditRowField>
        </Datagrid>
    </ReferenceManyField>

    if (loc.type === 'table')
        return <Box sx={{ marginBottom: '10px' }}>
            <Edit resource={'config/Table'} id={id}>
                <SimpleForm toolbar={<></>} component={MyWrapper}>
                    {edit}
                </SimpleForm>
            </Edit>
            <Create resource={'config/Property'} redirect={false}>
                <EditForm schema={schema} transform={
                    (data: any) => {
                        return { ...data, parent: 'dj/' + loc.database + '/' + util.encodeTableOrColumnName(loc.table) }
                    }
                } label={widget.text ? widget.text : 'Edit'} >{[]}</EditForm>
            </Create>
        </Box>
    else
        return <Box sx={{ marginBottom: '10px' }}>
            {edit}
            <Create resource={util.toResource(prop)} redirect={false}>
                <EditForm schema={schema} label={widget.text ? widget.text : 'Edit'} transform={
                    (data: any) => {
                        data = { ...data }
                        data[prop.property] = loc.id
                        return data
                    }
                } >{[]}</EditForm>
            </Create>
        </Box>
}

const MyWrapper = ({ children }: { children: any }) => {
    return <Box sx={{ paddingTop: '48px' }}>{children}</Box>
}

export default EditRelated

/**
 * Metadata
 */
export const config = {
    id: 'editRelated',

    // capitalized version
    title: 'Edit Related',

    // description in widget chooser
    description: 'Edit related records',
    version: 1,
    icon: <Icon>share</Icon>,
    controls: {
        type: 'autoform',
        schema: {
            properties: {
                title: title,
                prop: prop,
                columns: columns
            },
        },
    }
}
