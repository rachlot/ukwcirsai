import { Icon } from '@mui/material'
import { title } from '../api/Const'
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import React, { useState } from 'react';
import { useLoc } from '../hooks/useLoc';
import { Widget } from '../model/widget';
import Tooltip from '@mui/material/Tooltip';
import TextField from '@mui/material/TextField';
import { useDataProvider, useNotify, useRefresh } from 'react-admin';
import { useExpressionContext } from '../hooks/useExpressionContext';
import { util } from '../api/Util';
import { action } from '../api/Action';
import { useNavigate } from "react-router";
import { Value } from '../components/Value';
import Map from './Map';
import { DrawChart } from './Chart';
import { GraphData } from './Graph';

/**
 * JSONata notebook
 */
export const Notebook = ({ widget }: { widget: Widget }) => {

    const loc = useLoc()
    const dataProvider = useDataProvider()
    const context = useExpressionContext()
    const notify = useNotify()
    const refresh = useRefresh()
    const navigate = useNavigate()

    /**
     * load notebook state from session storage or widget layout
     */
    const loadState = (): Line[] => {
        let lines
        const id = 'djnotebook-' + loc.page
        const session = sessionStorage.getItem(id)
        if (session)
            lines = JSON.parse(session)
        else if (widget.columns)
            lines = widget.columns.map((item: any) => { return { expression: item } })
        else
            lines = []
        if (lines.length === 0)
            lines.push({ expression: '' })
        return lines
    }

    /**
     * write state to session store
     */
    const saveState = () => {
        const id = 'djnotebook-' + loc.page
        let x = JSON.stringify(lines)
        if (x.length > 5000000) {
            for (const line of lines)
                if (line.result)
                    if (JSON.stringify(line.result).length > 1000000)
                        line.result = '"Result display limited to 5 MB"'
            x = JSON.stringify(lines)
        }
        sessionStorage.setItem(id, x)
        setLines([...lines])
    }

    /**
     * restore notebook to on disk state
     */
    const restoreNotebook = () => {
        const id = 'djnotebook-' + loc.page
        sessionStorage.removeItem(id)
        setLines(loadState())
    }

    /**
     * context - include variable from other lines
     */
    const varContext = () => {
        const res = { ...context }
        res.notebook = {}
        for (const line of lines)
            if (line.variable)
                res.notebook[line.variable] = line.result
        return res
    }

    /**
     * replace $var with notebook.var
     */
    const vars = (l: Line): string => {
        let e = l.expression
        for (const line of lines)
            if (line.variable && line !== l) {
                // tokenize by $var
                const parts = e.split('$' + line.variable)
                const nonPrefix = [parts[0]]
                for (let i = 1; i < parts.length; i++) {
                    const first = parts[i].charAt(0)
                    // check if the string after the $var split starts with letter digit or _
                    if (/^[0-9a-zA-Z_]$/.test(first))
                        // no, something line $var2 undo the split
                        nonPrefix[nonPrefix.length - 1] = nonPrefix[nonPrefix.length - 1] + '$' + line.variable + parts[i]
                    else
                        nonPrefix.push(parts[i])
                }
                e = nonPrefix.join('notebook.' + line.variable)
            }
        return e
    }

    /**
     * run expression and assign variable if the expression starts with $var := 
     */
    const run = async (index: number) => {
        const line = lines[index]
        line.result = '...'
        setLines([...lines])
        try {
            // parse variable
            line.variable = undefined
            if (line.expression) {
                let v = line.expression.trim()
                if (v.startsWith('$'))
                    v = v.substring(1)
                const parts = v.split(':=')
                if (parts.length > 1) {
                    if (/^[0-9a-zA-Z_]+$/.test(parts[0].trim())) {
                        for (const l of lines)
                            if (l !== line)
                                if (l.variable === parts[0].trim())
                                    throw new Error('Variable $' + parts[0].trim() + ' is already used in this notebook.')
                        line.variable = parts[0].trim()
                    }
                }
            }

            line.result = action.isAction(vars(line)) ? await dataProvider.action(vars(line), varContext(), notify, refresh, navigate) : await dataProvider.expression(vars(line), varContext())
        } catch (err: any) {
            line.result = err.message
        }
        saveState()
    }

    /**
     * add a line with upload content
     */
    const upload = async (files: FileList) => {
        const result: any = {}
        for (let i = 0; i < files.length; i++) {
            const name = files.item(i)!.name.replace('.', '_')
            const xlsx = files.item(i)!.name.toLocaleLowerCase().endsWith('.xlsx')
            const res = await util.read(files.item(i)!, xlsx)
            try {
                result[name] = JSON.parse(res)
            } catch (err) {
                result[name] = res
            }
        }

        lines.push({ expression: '$upload := ...', result, variable: 'upload', upload: true })
        saveState()
    }

    /**
     * save notebook
     */
    const write = async () => {
        await dataProvider.update('config/page', {
            id: loc.page!,
            data: {
                id: loc.page!,
                layout: {
                    widget: 'page',
                    pageLayout: 'horizontal',
                    children: [{
                        widget: 'notebook',
                        title: 'Dashjoin Notebook',
                        columns: lines.map(line => line.expression)
                    }]
                }
            },
            previousData: {}
        })
        notify('Ok')
    }

    const [lines, setLines] = useState(loadState())

    let i = 0

    return <>
        {
            lines.map(line => {
                const index = i
                return <React.Fragment key={i++}>
                    <Stack direction="row" spacing={1}>
                        <TextField multiline value={line.expression}
                            inputProps={{ style: { fontSize: 'small', fontFamily: 'monospace' } }}
                            sx={{ minWidth: 'calc(100% - 48px - 48px)' }}
                            onKeyDown={event => {
                                if (event.ctrlKey && event.key === 'Enter')
                                    run(index)
                            }}
                            onChange={event => {
                                line.expression = event.target.value
                                saveState()
                            }}></TextField>
                        <Tooltip title="Run (CTRL + ENTER)"><IconButton onClick={_ => run(index)}><Icon>play_circle_outline</Icon></IconButton></Tooltip>
                        <Tooltip title="Delete this line"><IconButton onClick={_ => {
                            lines.splice(index, 1)
                            saveState()
                        }}><Icon>delete_outline</Icon></IconButton></Tooltip>
                    </Stack >
                    <Result line={line}></Result>
                </React.Fragment>
            })
        }
        <Stack direction="row" spacing={1}>
            <Tooltip title="Add a blank line"><IconButton onClick={_ => {
                lines.push({ expression: '' })
                saveState()
            }}><Icon>add</Icon></IconButton></Tooltip>
            <Tooltip title="Add line with a variable set to the file contents"><Button variant="contained" component="label">
                Upload...
                <input hidden multiple type="file" onChange={event => {
                    if (event.target.files)
                        upload(event.target.files)
                }} />
            </Button></Tooltip>
            <Tooltip title="Restore saved state"><IconButton onClick={_ => restoreNotebook()}><Icon>restore</Icon></IconButton></Tooltip>
            <Tooltip title="Save this notebook"><IconButton onClick={write}><Icon>save</Icon></IconButton></Tooltip>
        </Stack >
    </>
}

const Result = ({ line }: { line: Line }) => {
    if (line.result?.data) {
        if (line.result?.widget === 'table' || line.result?.widget === 'display')
            return <Value data={line.result.data} schema={util.inferSchemaFromData(line.result.data)} resource='Notebook'></Value>
        if (line.result?.widget === 'map')
            return <Map widget={{ ...line.result, display: JSON.stringify(line.result.data) }}></Map>
        if (line.result?.widget === 'chart')
            return <DrawChart widget={line.result} data={line.result.data} schema={util.inferSchemaFromData(line.result.data)}></DrawChart>
        if (line.result?.widget === 'graph')
            return <GraphData data={line.result.data} widget={line.result} />
    }
    return <pre style={{
        fontSize: 'small',
        overflowY: 'auto',
        maxHeight: '20em',
        overflowX: 'auto',
        maxWidth: 'calc(100vw - 32px - 24px - 200px)'
    }}>
        {typeof line.result === 'object' ? JSON.stringify(line.result, null, 2) : (
            typeof line.result === 'boolean' ? '' + line.result : line.result)}
    </pre>

}

export default Notebook

/**
 * Metadata
 */
export const config = {
    id: 'notebook',

    // capitalized version
    title: 'Notebook',

    // description in widget chooser
    description: 'JSONata Notebook for experimenting with expressions',
    version: 1,
    icon: <Icon>edit_note</Icon>,
    controls: {
        type: 'autoform',
        schema: {
            properties: {
                title: title
            },
        },
    }
}

/**
 * line state
 */
interface Line {

    /**
     * expression for this line
     */
    expression: string

    /**
     * expression result (undefined if it has not been run)
     */
    result?: any

    /**
     * if the expression starts with $var := , this value is "var"
     */
    variable?: string

    /**
     * is this an uploaded line?
     */
    upload?: boolean
}
