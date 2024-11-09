import TextField from '@mui/material/TextField';
import { useController } from 'react-hook-form';
import ExpressionPreview from '../components/ExpressionPreview';
import { Schema } from "../model/schema"
import { useLoc } from '../hooks/useLoc';
import { util } from '../api/Util';
import { Loading, useGetOne } from 'react-admin';
import { PrintError } from '../components/PrintError';
import { Icon, IconButton, Tooltip } from '@mui/material';
import { useState } from 'react';
import { api } from '../api/Api';
import { profile } from '../api/Profile';

// run button and various UI elements
const width = 'calc(100vw - 32px - 60px - 24px - 200px)'

/**
 * custom input controller for expressions.{foreach, expression}
 */
const StreamExpression = () => {

    const input1 = useController({ name: 'expressions.foreach', defaultValue: '' });
    const input2 = useController({ name: 'expressions.expression', defaultValue: '' });

    return <>
        <ExpressionInput input={input1} foreach={true} label="foreach"></ExpressionInput>
        <ExpressionInput input={input2} contextExpression={input1} foreach={false} label="expression"></ExpressionInput>
    </>
};
export default StreamExpression

/**
 * copied and pasted from src/uniforms/Expression.tsx
 * uses https://marmelab.com/react-admin/Inputs.html#using-usecontroller
 * instead of uniform custom component wrapper
 */
const ExpressionInput = ({ input, foreach, label, contextExpression }: { input: any, foreach: boolean, label: string, contextExpression?: any }) => {
    // preview is empty initially, only set when run is clicked or CTRL enter pressed
    const [preview, setPreview] = useState('')
    const [context, setContext] = useState(null)
    return <>
        <TextField multiline onKeyDown={(e: any) => e.ctrlKey && e.key === 'Enter' ? setPreview(input.field.value) : ''} inputProps={{ style: { fontFamily: 'monospace', fontSize: 'small' } }} sx={{ width }} label={label} {...input.field} />
        <Tooltip title="Run (CTRL + ENTER)"><IconButton onClick={async _ => {
            if (contextExpression?.field.value) {
                const c = await api.expressionPreview(contextExpression.field.value, null, true)
                if (Array.isArray(c) && c.length > 0)
                    setContext(c[0])
                else
                    setContext(c)
            }
            setPreview(input.field.value)
        }}><Icon>play_circle_outline</Icon></IconButton></Tooltip>
        <ExpressionPreview expression={preview} context={context} foreach={foreach}></ExpressionPreview>
    </>
}

/**
 * edit expression (for config/on-login)
 */
export const ConfigExpression = ({ schema }: { schema: Schema }) => {
    // preview is empty initially, only set when run is clicked or CTRL enter pressed
    const [preview, setPreview] = useState('')
    const input = useController({ name: schema.name!, defaultValue: '' });
    const context = {
        roles: profile.getRoles(),
        email: profile.getEmail(),
        variable: profile.getVariable(),
        href: window.location.href,
        user: profile.getUser()
    }

    return <>
        <TextField multiline onKeyDown={(e: any) => e.ctrlKey && e.key === 'Enter' ? setPreview(input.field.value) : ''} inputProps={{ style: { fontFamily: 'monospace', fontSize: 'small' } }} sx={{ width }} label={schema.title} {...input.field} />
        <Tooltip title="Run (CTRL + ENTER)"><IconButton onClick={_ => setPreview(input.field.value)}><Icon>play_circle_outline</Icon></IconButton></Tooltip>
        <ExpressionPreview expression={preview} context={context} foreach={false}></ExpressionPreview >
    </>
}

/**
 * edit expression (for DB trigger)
 */
export const Expression = ({ schema }: { schema: Schema }) => {
    // preview is empty initially, only set when run is clicked or CTRL enter pressed
    const [preview, setPreview] = useState('')
    const input = useController({ name: schema.name!, defaultValue: '' });
    const loc = useLoc()
    const { data, isLoading, error } = useGetOne('config/Table', { id: 'dj/' + loc.database + '/' + util.encodeTableOrColumnName(loc.table) })
    if (isLoading) return <Loading />
    if (error) return <PrintError error={error}></PrintError>

    let pk = util.getPrimaryKey(data)
    if (!pk)
        pk = {
            name: 'ID',
            type: 'string'
        }
    const command = schema.name?.split('-')?.[1]
    const context: any = {
        command,
        database: loc.database,
        table: loc.table,
    }
    if (command !== 'delete') {
        context.object = {}
        context.object[pk.name!] = pk.type === 'string' ? 'key' : 0
    }
    if (command !== 'create') {
        context.search = {}
        context.search[pk.name!] = pk.type === 'string' ? 'key' : 0
    }

    return <>
        <TextField multiline onKeyDown={(e: any) => e.ctrlKey && e.key === 'Enter' ? setPreview(input.field.value) : ''} inputProps={{ style: { fontFamily: 'monospace', fontSize: 'small' } }} sx={{ width }} label={schema.title} {...input.field} />
        <Tooltip title="Run (CTRL + ENTER)"><IconButton onClick={_ => setPreview(input.field.value)}><Icon>play_circle_outline</Icon></IconButton></Tooltip>
        <ExpressionPreview expression={preview} context={context} foreach={false}></ExpressionPreview >
    </>
}
