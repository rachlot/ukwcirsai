import { DateInput, Form, Loading, RecordContext } from "react-admin"
import { Widget } from "../model/widget"
import { PrintError } from "../components/PrintError"
import { database, style, table, title } from "../api/Const"
import AddchartIcon from '@mui/icons-material/Addchart'
import { Value } from "../components/Value"
import { useDjQuery } from "../hooks/useDjQuery"
import { DrawChart } from "./Chart"
import Columns from "../uniforms/Columns"
import { ColInfo, Filter, FilterInput } from "../model/col-info"
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import { useState } from "react"
import { useExpression } from "../hooks/useExpression"
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import Slider from '@mui/material/Slider';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Divider from '@mui/material/Divider';

/**
 * table / chart widget that allows ad hoc creation of a query and that shows
 * UI inputs for applying filters
 */
export const Analytics = ({ widget }: { widget: Widget }) => {

    // db query
    const { data, isLoading, error } = useExpression(widget.cached!, widget.arguments!)
    if (isLoading) return <Loading />
    if (error) return <PrintError error={error}></PrintError>

    let columns: ColInfo[] = []

    // translate between UI and API operators
    const translate = (s: string): Filter => {
        switch (s) {
            case '=': return Filter.EQUALS
            case '<>': return Filter.NOT_EQUALS
            case '<=': return Filter.SMALLER_EQUAL
            case '>=': return Filter.GREATER_EQUAL
            case 'BETWEEN': return Filter.BETWEEN
            case 'LIKE': return Filter.LIKE
            case 'IS_NULL': return Filter.IS_NULL
            case 'IS_NOT_NULL': return Filter.IS_NOT_NULL
        }
        return Filter.EQUALS
    }

    // widget specifies columns and filters in two seperate lists (for usability)
    // both lists must be merged into columns
    if (widget.columns)
        columns = widget.columns.map(c => { return { ...(c as any), project: true } })
    const filters = (widget as any).filter ? (widget as any).filter : []
    for (const f of filters) {
        let column
        for (const c of columns)
            if (c.name === f.name)
                column = c
        if (column) {
            column.filter = translate(f.operator)
            column.label = f.operator
            column.input = f.input
        } else
            columns.push({ name: f.name, filter: translate(f.operator), input: f.input, label: f.operator })
    }

    if (columns.length === 0)
        return <p>Analytics - please define columns to project</p>
    if (widget.database)
        return <AnalyticsInner widget={widget} columns={columns} args={data}></AnalyticsInner>
    else
        return <p>Analytics - please provide a database to run the query on</p>
}

const AnalyticsInner = ({ widget, columns, args }: { widget: Widget, columns: ColInfo[], args: any }) => {

    // filter state
    const [filterState, setFilterState] = useState<FilterInput[]>(columns.map(c => { return { name: c.name } }))

    // query holds the table
    const widgetClone = { ...widget }
    widgetClone.query = '__dj_analytics'

    // merge colInfo with user filter input
    const queryArgs: ColInfo[] = JSON.parse(JSON.stringify(columns))
    for (const q of queryArgs)
        for (const fs of filterState)
            if (fs.name === q.name) {
                if (Array.isArray(fs.arg)) {
                    (q as any).arg1 = fs.arg[0];
                    (q as any).arg2 = fs.arg[1]
                }
                else
                    (q as any).arg1 = fs.arg

                if (q.filter === Filter.IS_NULL)
                    q.filter = fs.arg ? Filter.IS_NOT_NULL : Filter.IS_NULL
            }

    // console.log(filterState, queryArgs)

    const { data, isLoading, error } = useDjQuery(widgetClone, {
        table: widget.table,
        query: widget.query,
        arguments: args,
        cols: queryArgs
    })
    if (isLoading) return <Loading />
    if (error) return <PrintError error={error}></PrintError>

    // check if filter state has to be reset
    if (filterState.length !== columns.length) {
        setFilterState(columns.map(c => { return { name: c.name } }))
        return <Loading />
    }
    else {
        for (let i = 0; i < filterState.length; i++)
            if (filterState[i].name !== columns[i].name) {
                setFilterState(columns.map(c => { return { name: c.name } }))
                return <Loading />
            }
    }

    if ((widget as any).filter?.length > 0) {
        // filer
        let i = 0
        const filterEl = filterState.map((f, index) => <FilterEl widget={widget} colInfo={columns[index]} fi={f} key={i++}
            onChange={e => {
                // '' is undefined
                e = e === '' ? undefined : e
                for (const x of filterState) {
                    if (x.name === f.name)
                        x.arg = e
                }
                setFilterState([...filterState])
            }}
        ></FilterEl>)
        if (widget.chart && widget.chart !== 'table')
            return <Box sx={{ flexGrow: 1 }}>
                <Grid container spacing={2}>
                    <Grid item xs={2}>
                        <Paper sx={{ height: '100%', paddingLeft: 1, paddingRight: 1 }}>{filterEl}</Paper>
                    </Grid>
                    <Grid item xs={10}>
                        <Paper>
                            <DrawChart widget={widget} data={data?.data} schema={data?.schema}></DrawChart>
                        </Paper>
                    </Grid>
                </Grid>
            </Box>
        else
            return <Box sx={{ flexGrow: 1 }}>
                <Grid container spacing={2}>
                    <Grid item xs={2}>
                        <Paper sx={{ height: 'calc(100% - 52px - 64px)', paddingLeft: 1, paddingRight: 1, marginTop: '64px', marginBottom: '52px' }}>{filterEl}</Paper>
                    </Grid>
                    <Grid item xs={10}>
                        <Value data={data?.data} schema={data?.schema} resource={'TODO'} perPage={widget.perPage}></Value>
                    </Grid>
                </Grid>
            </Box>
    }
    else
        // no filter
        if (widget.chart && widget.chart !== 'table')
            return <DrawChart widget={widget} data={data?.data} schema={data?.schema}></DrawChart>
        else
            return <Value data={data?.data} schema={data?.schema} resource={'TODO'} perPage={widget.perPage}></Value>
}

/**
 * a single filter element
 */
const FilterEl = ({ widget, colInfo, fi, onChange }: { widget: Widget, colInfo: ColInfo, fi: FilterInput, onChange: (x: any) => void }) => {
    if (colInfo.filter === undefined)
        return <></>
    if (colInfo.filter === Filter.IS_NOT_NULL || colInfo.filter === Filter.IS_NULL)
        return <>
            <Divider sx={{ paddingTop: 1 }} />
            <SwitchFilter widget={widget} colInfo={colInfo} fi={fi} onChange={onChange}></SwitchFilter>
            <Divider sx={{ marginBottom: 1 }} />
        </>
    if (colInfo.input === 'switch')
        return <>
            <Divider sx={{ paddingTop: 1 }} />
            <BooleanFilter widget={widget} colInfo={colInfo} fi={fi} onChange={onChange}></BooleanFilter>
            <Divider sx={{ marginBottom: 1 }} />
        </>
    if (colInfo.input === 'slider')
        return <>
            <Divider sx={{ paddingTop: 1 }} />
            <Box sx={{ marginLeft: 1, marginRight: 1 }}>
                <SliderFilter widget={widget} colInfo={colInfo} fi={fi} onChange={onChange}></SliderFilter>
            </Box>
            <Divider sx={{ marginBottom: 1 }} />
        </>
    if (colInfo.input === 'select')
        return <SelectFilter widget={widget} colInfo={colInfo} fi={fi} onChange={onChange}></SelectFilter>
    if (colInfo.input === 'date')
        return <DateFilter widget={widget} colInfo={colInfo} fi={fi} onChange={onChange}></DateFilter>

    return <TextFilter widget={widget} colInfo={colInfo} fi={fi} onChange={onChange}></TextFilter>
}

const SwitchFilter = ({ widget, colInfo, fi, onChange }: { widget: Widget, colInfo: ColInfo, fi: FilterInput, onChange: (x: any) => void }) => {
    const [text, setText] = useState(fi.arg === undefined ? (colInfo.filter === Filter.IS_NOT_NULL) : fi.arg)
    return <FormControlLabel control={<Switch
        checked={text}
        onChange={
            e => {
                setText(e.target.checked)
                onChange(e.target.checked)
            }
        }
    />} label={colInfo.name} />
}

const BooleanFilter = ({ widget, colInfo, fi, onChange }: { widget: Widget, colInfo: ColInfo, fi: FilterInput, onChange: (x: any) => void }) => {
    const [text, setText] = useState(fi.arg ? true : false)
    return <FormControlLabel control={<Switch
        checked={text}
        onChange={
            e => {
                setText(e.target.checked)
                onChange(e.target.checked)
            }
        }
    />} label={colInfo.name} />
}

const TextFilter = ({ widget, colInfo, fi, onChange }: { widget: Widget, colInfo: ColInfo, fi: FilterInput, onChange: (x: any) => void }) => {
    const [text, setText] = useState(fi.arg ? fi.arg : '')
    return <TextField label={colInfo.name + ' ' + (colInfo.label ? colInfo.label : '=')} variant="filled"
        value={text}
        onChange={e => setText(e.target.value)}
        onBlur={e => onChange(text)}
    />
}

const DateFilter = ({ widget, colInfo, fi, onChange }: { widget: Widget, colInfo: ColInfo, fi: FilterInput, onChange: (x: any) => void }) => {
    if (colInfo.filter === Filter.BETWEEN)
        return <RecordContext.Provider value={{ from: fi.arg?.[0], to: fi.arg?.[1] }}>
            <Form>
                <DateInput label={colInfo.name + ' ' + (colInfo.label ? colInfo.label : '=')} source='from'
                    onBlur={e => onChange([e.target.value, fi.arg?.[1]])}
                />
                <DateInput label={colInfo.name + ' ' + (colInfo.label ? colInfo.label : '=')} source='to'
                    onBlur={e => onChange([fi.arg?.[0], e.target.value])}
                />
            </Form>
        </RecordContext.Provider>
    else
        return <RecordContext.Provider value={{ field: fi.arg }}>
            <Form>
                <DateInput label={colInfo.name + ' ' + (colInfo.label ? colInfo.label : '=')} source='field'
                    onBlur={e => onChange(e.target.value)}
                />
            </Form>
        </RecordContext.Provider>
}

const SliderFilter = ({ widget, colInfo, fi, onChange }: { widget: Widget, colInfo: ColInfo, fi: FilterInput, onChange: (x: any) => void }) => {
    const { data, isLoading, error } = useExpression(true, '$distinct($all("' + widget.database + '", "' + widget.table + '", 0, 10000)."' + colInfo.name + '")')
    if (isLoading) return <Loading />
    if (error) return <PrintError error={error}></PrintError>

    if (!Array.isArray(data) || data.length < 2)
        return <p>Slider requires at least two distinct values</p>

    let min = data[0]
    let max = data[0]
    for (const i of data) {
        if (i < min) min = i
        if (max < i) max = i
    }

    if (min === undefined)
        return <p>Slider requires at least two distinct values</p>

    if (typeof min === 'number')
        return <SliderFilterInner min={min} max={max} colInfo={colInfo} fi={fi} onChange={onChange}></SliderFilterInner>
    else if (Date.parse(min) && Date.parse(max))
        return <DateSliderFilterInner min={min} max={max} colInfo={colInfo} fi={fi} onChange={onChange}></DateSliderFilterInner>
    else
        return <StringSliderFilterInner min={min} max={max} colInfo={colInfo} fi={fi} onChange={onChange}></StringSliderFilterInner>
}

const SliderFilterInner = ({ min, max, colInfo, fi, onChange }: { min: number, max: number, colInfo: ColInfo, fi: FilterInput, onChange: (x: any) => void }) => {
    const [value, setValue] = useState(colInfo.filter === Filter.BETWEEN ? (fi.arg ? fi.arg : [min, max]) : (fi.arg ? fi.arg : min))
    return <>
        <InputLabel shrink={fi.arg !== undefined}>{colInfo.name + ' ' + (colInfo.label ? colInfo.label : '=')}</InputLabel>
        <Slider min={min} max={max} value={value} color={fi.arg === undefined ? 'warning' : 'primary'}
            valueLabelDisplay="auto"
            onChange={(_, value) => setValue(value as any)}
            onChangeCommitted={(e, value) => {
                onChange(value)
            }} />
    </>
}

const StringSliderFilterInner = ({ min, max, colInfo, fi, onChange }: { min: string, max: string, colInfo: ColInfo, fi: FilterInput, onChange: (x: any) => void }) => {
    max = String.fromCharCode(max.charCodeAt(0) + 1)
    const string2value = (s: string | string[]): any => Array.isArray(s) ? [s[0].charCodeAt(0), s[1].charCodeAt(0)] : s.charCodeAt(0)
    const value2string = (v: number | number[]): any => Array.isArray(v) ? [String.fromCharCode(v[0]), String.fromCharCode(v[1])] : String.fromCharCode(v)
    const [value, setValue] = useState(colInfo.filter === Filter.BETWEEN ? (fi.arg ? string2value(fi.arg) : [string2value(min), string2value(max)]) : (fi.arg ? string2value(fi.arg) : string2value(min)))
    return <>
        <InputLabel shrink={fi.arg !== undefined}>{colInfo.name + ' ' + (colInfo.label ? colInfo.label : '=')}</InputLabel>
        <Slider min={string2value(min)} max={string2value(max)} value={value} color={fi.arg === undefined ? 'warning' : 'primary'}
            valueLabelDisplay="auto"
            onChange={(_, value) => setValue(value as any)}
            valueLabelFormat={value2string}
            onChangeCommitted={(e, value) => {
                onChange(value2string(value))
            }} />
    </>
}

const DateSliderFilterInner = ({ min, max, colInfo, fi, onChange }: { min: string, max: string, colInfo: ColInfo, fi: FilterInput, onChange: (x: any) => void }) => {
    const format = (v: number): string => new Date(v).toISOString().split('T')[0]
    const string2value = (s: string | string[]): any => Array.isArray(s) ? [Date.parse(s[0]), Date.parse(s[1])] : Date.parse(s)
    const value2string = (v: number | number[]): any => Array.isArray(v) ? [format(v[0]), format(v[1])] : format(v)
    const [value, setValue] = useState(colInfo.filter === Filter.BETWEEN ? (fi.arg ? string2value(fi.arg) : [string2value(min), string2value(max)]) : (fi.arg ? string2value(fi.arg) : string2value(min)))
    return <>
        <InputLabel shrink={fi.arg !== undefined}>{colInfo.name + ' ' + (colInfo.label ? colInfo.label : '=')}</InputLabel>
        <Slider min={string2value(min)} max={string2value(max)} value={value} color={fi.arg === undefined ? 'warning' : 'primary'}
            valueLabelDisplay="auto"
            onChange={(_, value) => setValue(value as any)}
            valueLabelFormat={value2string}
            onChangeCommitted={(e, value) => {
                onChange(value2string(value))
            }} />
    </>
}

const SelectFilter = ({ widget, colInfo, fi, onChange }: { widget: Widget, colInfo: ColInfo, fi: FilterInput, onChange: (x: any) => void }) => {
    const [text, setText] = useState(colInfo.filter === Filter.BETWEEN ? (fi.arg ? fi.arg : ['', '']) : (fi.arg ? fi.arg : ''))
    const { data, isLoading, error } = useExpression(true, '$distinct($all("' + widget.database + '", "' + widget.table + '", 0, 10000)."' + colInfo.name + '")')
    if (isLoading) return <Loading />
    if (error) return <PrintError error={error}></PrintError>

    if (colInfo.filter === Filter.BETWEEN)
        return <><FormControl fullWidth>
            <InputLabel>{colInfo.name + ' ' + (colInfo.label ? colInfo.label : '=')}</InputLabel>
            <Select value={text[0]}
                onChange={e => {
                    const pair = [e.target.value, text[1]]
                    setText(pair)
                    onChange(pair)
                }}
            >
                <MenuItem value={''}>{'---'}</MenuItem>
                {data.sort().map((i: any) => <MenuItem key={i} value={i}>{i}</MenuItem>)}
            </Select>
        </FormControl>
            <FormControl fullWidth>
                <InputLabel>{colInfo.name + ' ' + (colInfo.label ? colInfo.label : '=')}</InputLabel>
                <Select value={text[1]}
                    onChange={e => {
                        const pair = [text[0], e.target.value]
                        setText(pair)
                        onChange(pair)
                    }}
                >
                    <MenuItem value={''}>{'---'}</MenuItem>
                    {data.sort().map((i: any) => <MenuItem key={i} value={i}>{i}</MenuItem>)}
                </Select>
            </FormControl></>
    else
        return <FormControl fullWidth>
            <InputLabel>{colInfo.name + ' ' + (colInfo.label ? colInfo.label : '=')}</InputLabel>
            <Select value={text}
                onChange={e => {
                    setText(e.target.value)
                    onChange(e.target.value)
                }}
            >
                <MenuItem value={''}>{'---'}</MenuItem>
                {data.sort().map((i: any) => <MenuItem key={i} value={i}>{i}</MenuItem>)}
            </Select>
        </FormControl>
}

export const config = {
    id: 'analytics',
    title: 'Analytics',
    description: 'Display a chart based on user filters',
    version: 1,
    icon: <AddchartIcon />,
    controls: {
        type: 'autoform',
        schema: {
            properties: {
                title: title,
                database: database,
                table: table,
                chart: {
                    title: 'Chart type',
                    type: 'string',
                    enum: ['table', 'bar', 'line', 'doughnut', 'radar', 'polarArea'],
                },
                style: style,
                columns: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            name: {
                                uniforms: {
                                    component: Columns
                                }
                            },
                            aggregation: { enum: ['GROUP_BY', 'COUNT', 'COUNT_DISTINCT', 'MIN', 'MAX', 'GROUP_CONCAT', 'GROUP_CONCAT_DISTINCT', 'AVG', 'SUM', 'STDDEV'] },
                        }
                    }
                },
                filter: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            name: {
                                uniforms: {
                                    component: Columns
                                }
                            },
                            operator: { enum: ['=', '<>', 'LIKE', 'IS_NULL', '<=', '>=', 'BETWEEN'] },
                            input: { enum: ['text', 'slider', 'switch', 'date', 'select'] }
                        }
                    }
                }
            }
        }
    }
}