import { Accordion, AccordionDetails, AccordionSummary, Autocomplete, FormControlLabel, ListItemIcon, ListItemText, Stack, Switch, TableFooter, TablePagination, TextField, Tooltip, Typography } from "@mui/material";
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import FormControl from '@mui/material/FormControl';
import Icon from '@mui/material/Icon';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import LinearProgress from '@mui/material/LinearProgress';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import { NestedMenuItem } from 'mui-nested-menu';
import Image from 'next/image';
import React, { useState } from 'react';
import { useDataProvider, useNotify } from 'react-admin';
import { useController, useWatch } from 'react-hook-form';
import { useQuery } from "react-query";
import { util } from '../api/Util';
import { DistinctRequest, MoveColumnRequest, QueryDatabase, QueryResponse, RemoveColumnRequest, RenameRequest, SetWhereRequest, SortRequest } from '../model/model';
import DoubleSampleMenu from "./DoubleSampleMenu";
import FilterExpression from "./FilterExpression";
import SampleMenu from "./SampleMenu";
import { LinkValue } from "../components/LinkValue";

const QueryEdit = () => {

    const dataProvider = useDataProvider()
    const notify = useNotify()

    // databases to tables map
    const tables = useQuery(['tables'], async () => { return dataProvider.tables() })
    const dbs: any = {}
    if (tables.data)
        for (const table of tables.data)
            if ('config' !== util.parseTableID(table).database) {
                if (!dbs[util.parseTableID(table).database])
                    dbs[util.parseTableID(table).database] = ['']
                dbs[util.parseTableID(table).database].push(util.parseTableID(table).table)
            }

    // access to current form value
    const all = useWatch()

    // link to the RA form
    const databaseController = useController({ name: 'database' })
    const queryController = useController({ name: 'query' })

    // editor state
    const [response, setResponse] = useState<QueryResponse>({
        data: [],
        fieldNames: [],
        database: '',
        distinct: false,
        joinOptions: [],
        compatibilityError: '',
        query: '',
        metadata: []
    })

    // called after data provider calls
    const setResponse2 = (res: QueryResponse) => {
        setHistory([...history, response]);
        setRedoHistory([]);
        setResponse(res)
        setQueryedit(res.query)
        setLoading(false)
    }

    // undo / redo
    const [history, setHistory] = useState<QueryResponse[]>([]);
    const [redoHistory, setRedoHistory] = useState<QueryResponse[]>([]);

    // pagination
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // table / data selection
    const [database, setDatabase] = useState(all.database ? util.parseDatabaseID(all.database).database : '')

    // query state
    const [queryedit, setQueryedit] = useState(all.query)

    // dialog open state
    const [open, setOpen] = useState(false)

    // help dialog open state
    const [help, setHelp] = useState(false)

    // loading state
    const [loading, setLoading] = useState(false)

    // order by state
    const [orderby, setOrderby] = useState({ column: '', direction: undefined })

    // col menu
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const tableMenuOpen = Boolean(anchorEl);
    const [column, setColumn] = useState('');

    // key counter for components
    let counter = 0

    // group join options by table
    const joinOptions: any = {};
    for (const ar of response.joinOptions) {
        joinOptions[ar.add.table] = [];
    }
    for (const ar of response.joinOptions) {
        joinOptions[ar.add.table].push(ar);
    }

    // table colors
    const colors = [
        'lightcoral', 'lightgreen', 'lightskyblue',
        'lightgray', /*'white',*/ 'green', 'red', 'blue', 'lavender',
        'aquamarine', 'bisque', 'darkkhaki',
        'lightgoldenrodyellow'
    ]

    const tableColor: { [key: string]: string } = {}
    let colorIndex = 0

    const joinoptionTables = Object.keys(joinOptions)
    const projectionTables = response.metadata.map(e => e.col.table)
    const allTables = [...new Set([...joinoptionTables, ...projectionTables])]

    for (const t of allTables.sort())
        tableColor[t] = colors[colorIndex++ % colors.length]

    const tenDistinctValues = (c?: string) => {
        // use 10 distinct values from data
        const arr: any[] = []
        for (const row of response.data) {
            const item = row[c ? c : column]
            if (!arr.includes(item) && !(typeof item === 'string' && item?.includes('\'')))
                if (item !== null)
                    if (item !== undefined)
                        arr.push(item)
            if (arr.length === 10)
                break
        }
        return arr
    }

    const setGroupBy = async (c: string, e?: string) => {
        setAnchorEl(null)
        setLoading(true)
        const r: SetWhereRequest = {
            database: 'dj/' + database,
            query: response.query,
            cols: []
        }
        for (const col of response.fieldNames) {
            const index = response.fieldNames.indexOf(col)

            let condition
            if (!e)
                // Remove all
                condition = 'GROUP BY'
            else {
                const current = response.metadata[index].groupBy
                if (col === c)
                    condition = e
                else
                    if (current)
                        // query already is a group by query => no change
                        condition = current
                    else
                        // query is a normal query (metadata.groupby is null)
                        condition = e === 'GROUP BY' ? 'COUNT' : 'GROUP BY'
            }

            r.cols.push({
                col: response.metadata[index].col,
                condition
            })
        }
        setResponse2(await dataProvider.setGroupBy(r))
    }

    const setWhere = async (c: string, e?: string) => {

        // if there is no operator, prepend "= "
        if (e) {
            let noop = true
            for (const op of ['IS NULL', 'IS NOT NULL', 'BETWEEN', 'LIKE', 'ILIKE', '!=', '==', '<>', '<=', '>=', '<', '>', '!', '=', 'REGEX'])
                if (typeof e === 'string' && e.trim().toUpperCase().startsWith(op))
                    noop = false
            if (noop) {
                if (Number.isNaN(parseFloat(e)))
                    if (!e.trim().startsWith("'") || !e.trim().endsWith("'"))
                        e = "'" + e + "'"
                e = '= ' + e
            }
        }


        setAnchorEl(null)
        setLoading(true)
        const r: SetWhereRequest = {
            database: 'dj/' + database,
            query: response.query,
            cols: []
        }
        for (const col of response.fieldNames) {
            const index = response.fieldNames.indexOf(col)
            r.cols.push({
                col: response.metadata[index].col,
                condition: col === c ? (e ? e : undefined) : response.metadata[index].where
            })
        }
        setResponse2(await dataProvider.setWhere(r))
    }

    const run = async (query: string) => {
        const r: QueryDatabase = {
            database: 'dj/' + database,
            query
        }
        setLoading(true)
        try {
            setResponse2(await dataProvider.noop(r))
        }
        catch (ex) {
            notify(util.error(ex), { type: 'error' })
            setLoading(false)
        }
    }

    return <>
        <Dialog open={open} onClose={() => setOpen(false)} maxWidth={false}>
            <DialogContent>
                <LinearProgress variant={loading ? "indeterminate" : "determinate"} value={0} sx={{ marginBottom: '0.5rem' }} />

                <p style={{ color: 'red' }}>{response.compatibilityError}</p>

                <Stack flexWrap="wrap" direction='row'>
                    <FormControl>
                        <InputLabel>Database</InputLabel>
                        <Select
                            sx={{ minWidth: '100px' }}
                            value={database}
                            onChange={(e) => {
                                setDatabase(e.target.value)
                            }}
                        >
                            {Object.keys(dbs).map(key => <MenuItem key={counter++} value={key}>{key}</MenuItem>)}
                        </Select>
                    </FormControl>
                    &nbsp;
                    <FormControl>
                        <InputLabel>Table</InputLabel>
                        <Select
                            sx={{ minWidth: '100px' }}
                            value={''}
                            onChange={async (e) => {
                                setLoading(true)
                                setResponse2(await dataProvider.initialQuery({ table: 'dj/' + database + '/' + util.encodeTableOrColumnName(e.target.value) }))
                            }}
                        >
                            {(dbs[database] ? dbs[database] : []).map((key: string) => <MenuItem key={counter++} value={key}>{key}</MenuItem>)}
                        </Select>
                    </FormControl>
                    &nbsp;
                    <FormControlLabel
                        value="end"
                        control={<Switch color="primary" onChange={async _ => {
                            const r: DistinctRequest = {
                                database: 'dj/' + database, query: response.query, querylimit: response.querylimit, distinct: !response.distinct
                            }
                            setLoading(true)
                            setResponse2(await dataProvider.distinct(r))
                        }} />}
                        label="Distinct"
                        labelPlacement="end"
                    />
                    &nbsp;
                    <Autocomplete
                        sx={{ width: 150 }}
                        freeSolo
                        value={response.querylimit ? response.querylimit + '' : ''}
                        options={['1', '10', '100', '1000', '10000']}
                        onBlur={async (e: any) => {
                            const r: DistinctRequest = {
                                database: 'dj/' + database, query: response.query, querylimit: Math.abs(parseInt(e.target.value)), distinct: response.distinct
                            }
                            setLoading(true)
                            setResponse2(await dataProvider.distinct(r))
                        }}
                        renderInput={(params) => <TextField {...params} type='number' label='Limit'></TextField>}
                    ></Autocomplete>
                    &nbsp;
                    <Button disabled={history.length === 0} sx={{ height: 36, paddingLeft: '28px', marginTop: '14px' }} variant='contained' startIcon={<Icon>undo</Icon>} onClick={() => {
                        setRedoHistory([...redoHistory, response])
                        const res = history.pop()
                        setHistory([...history])
                        setResponse(res!)
                        setQueryedit(res?.query)
                    }}></Button>
                    &nbsp;
                    <Button disabled={redoHistory.length === 0} sx={{ height: 36, paddingLeft: '28px', marginTop: '14px' }} variant='contained' startIcon={<Icon>redo</Icon>} onClick={() => {
                        setHistory([...history, response])
                        const res = redoHistory.pop()
                        setRedoHistory([...redoHistory])
                        setResponse(res!)
                        setQueryedit(res?.query)
                    }}></Button>
                    &nbsp;
                    <Button sx={{ height: 36, paddingLeft: '28px', marginTop: '14px' }} variant='contained' startIcon={<Icon>cloud_download</Icon>} onClick={() => {
                        util.downloadCsv(response.data)
                    }}></Button>
                    &nbsp;
                    <Button sx={{ height: 36, paddingLeft: '28px', marginTop: '14px' }} variant='contained' startIcon={<Icon>help</Icon>} onClick={() => {
                        setHelp(true)
                    }}></Button>
                </Stack>

                <Stack direction='row' flexWrap="wrap">
                    {Object.entries(joinOptions).sort().map(([t, acs]) => {
                        return <Card key={counter++} sx={{ marginRight: 2, marginTop: 1, marginBottom: 1 }}>
                            <Box sx={{ padding: 1 }}>
                                <Stack direction='row'>
                                    <Avatar sx={{ bgcolor: tableColor[t], width: 40, height: 40 }} alt=''><Icon sx={{ color: tableColor[t] }}>home</Icon></Avatar>
                                    <Stack marginLeft={1}>
                                        <Typography sx={{ fontWeight: 'bold', marginBottom: -3 }}>{t}</Typography>
                                        <Box sx={{ width: '120px' }}>
                                            <FormControl variant="standard" fullWidth size="small">
                                                <InputLabel shrink={false}>{(acs as any).length + ' columns'}</InputLabel>
                                                <Select value={''} onChange={async e => {
                                                    try {
                                                        const r: any = e.target.value
                                                        r.query = response.query;
                                                        r.database = response.database;
                                                        r.limit = response.limit;
                                                        setResponse2(await dataProvider.qeAddColumn(r))
                                                    }
                                                    catch (ex) {
                                                        notify(util.error(ex), { type: 'error' })
                                                        setLoading(false)
                                                    }
                                                }} >
                                                    {(acs as any).map((ac: any) => <MenuItem sx={{ maxWidth: 800 }} value={ac} key={counter++} >{ac.add.column + ' = ' + ac.preview}</MenuItem>)}
                                                </Select>
                                            </FormControl>
                                        </Box>
                                    </Stack>
                                </Stack>
                            </Box>
                        </Card>
                    })}
                </Stack>

                <div style={{ overflowX: 'scroll' }}>
                    <Table size="small" sx={{ minWidth: 650 }} aria-label="simple table">
                        <TableHead>
                            <TableRow>
                                {response.fieldNames.map(c => <TableCell
                                    key={counter++}
                                    draggable={!response.compatibilityError}
                                    onDragStart={e => e.dataTransfer.setData('col', c)}
                                    onDragOver={e => e.preventDefault()}
                                    onDrop={async e => {
                                        const from = e.dataTransfer.getData('col')
                                        if (from !== c) {
                                            const r: MoveColumnRequest = {
                                                position: response.fieldNames.indexOf(from),
                                                col: response.metadata[response.fieldNames.indexOf(c)].col,
                                                database: 'dj/' + database,
                                                query: response.query
                                            }
                                            setLoading(true)
                                            setResponse2(await dataProvider.moveColumn(r))
                                        }
                                    }}
                                ><TableSortLabel
                                    disabled={response.compatibilityError ? true : false}
                                    key={counter++}
                                    active={c === orderby.column}
                                    direction={c === orderby.column ? orderby.direction : undefined}
                                    onClick={async _ => {
                                        // order by is a special case, since the state is not handled / deternimed by the backend
                                        let _orderby: any = undefined
                                        if (orderby?.column === c) {
                                            if (orderby.direction === 'asc')
                                                _orderby = { column: c, direction: 'desc' as any }
                                            else if (orderby.direction === undefined)
                                                _orderby = { column: c, direction: 'asc' as any }
                                            else
                                                _orderby = { column: '', direction: undefined }
                                        } else
                                            _orderby = { column: c, direction: 'asc' as any }
                                        setOrderby(_orderby)
                                        const r: SortRequest = {
                                            database: 'dj/' + database,
                                            query: response.query,
                                            limit: response.limit,
                                            col: response.metadata[response.fieldNames.indexOf(c)].col,
                                            order: _orderby.direction as any
                                        }
                                        setLoading(true)
                                        setResponse2(await dataProvider.sort(r))
                                    }}
                                >
                                        <IconButton
                                            sx={{ background: tableColor[response.metadata[response.fieldNames.indexOf(c)].col.table] }}
                                            onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
                                                setColumn(c)
                                                setAnchorEl(event.currentTarget);
                                            }}
                                        ><Icon>more_vert</Icon></IconButton>
                                        &nbsp;
                                        {c}
                                    </TableSortLabel></TableCell>)}
                            </TableRow>
                            <TableRow>
                                {response.fieldNames.map(c => <TableCell key={/* make sure subcomponent is redrawn */ response.query + counter++}>
                                    <FilterExpression
                                        disabled={util.isValue(response.metadata[response.fieldNames.indexOf(c)].groupBy) && (response.metadata[response.fieldNames.indexOf(c)].groupBy !== 'GROUP BY')}
                                        value={response.metadata[response.fieldNames.indexOf(c)].where}
                                        onChange={async (e: any) => setWhere(c, e)}
                                        options={tenDistinctValues(c)}
                                    />
                                </TableCell>)}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {response.data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => (
                                <TableRow
                                    key={counter++}
                                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                >
                                    {response.fieldNames.map((col: string) => <TableCell key={counter++} sx={{ whiteSpace: 'nowrap', maxWidth: '300px', overflowX: 'hidden' }}>
                                        <Cell data={row[col]} metadata={response.metadata[response.fieldNames.indexOf(col)]}></Cell>
                                    </TableCell>)}
                                </TableRow>
                            ))}
                        </TableBody>
                        <TableFooter>
                            <TableRow>
                                <TablePagination
                                    rowsPerPageOptions={[1, 5, 10, 20, 50]}
                                    count={response.data.length}
                                    rowsPerPage={rowsPerPage}
                                    page={page}
                                    onPageChange={(_, newpage) => setPage(newpage)}
                                    onRowsPerPageChange={(e: any) => {
                                        setPage(0)
                                        setRowsPerPage(e.target.value)
                                    }}
                                />
                            </TableRow>
                        </TableFooter>
                    </Table>
                </div>

                <Accordion>
                    <AccordionSummary expandIcon={<Icon>expand_more</Icon>} >
                        <Typography>View & edit query (run with CTRL+ENTER)</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <TextField
                            onKeyDown={async (e: any) => {
                                if (e.ctrlKey && e.key === 'Enter') {
                                    run(e.target.value)
                                }
                            }}
                            onChange={e => setQueryedit(e.target.value)}
                            value={queryedit}
                            multiline
                            inputProps={{ style: { fontFamily: 'monospace' } }}
                            sx={{ minWidth: '80vw', width: '100%' }}
                        ></TextField>
                        <Tooltip title="Run (CTRL + ENTER)"><IconButton onClick={_ => run(queryedit)}><Icon>play_circle_outline</Icon></IconButton></Tooltip>
                    </AccordionDetails>
                </Accordion>
            </DialogContent >
            <DialogActions>
                <Button onClick={() => setOpen(false)}>Cancel</Button>
                <Button variant="contained" onClick={() => {
                    if (all.arguments)
                        queryController.field.onChange(util.insertQueryParameterTemplates(util.transformQueryInfo({ arguments: all.arguments as any, query: response.query })))
                    else
                        queryController.field.onChange(response.query)
                    databaseController.field.onChange(response.database)
                    setOpen(false)
                }}>Ok</Button>
            </DialogActions>
        </Dialog >
        <Button
            variant="contained"
            onClick={async () => {
                setOpen(true)
                setResponse({
                    data: [],
                    fieldNames: [],
                    database: '',
                    distinct: false,
                    joinOptions: [],
                    compatibilityError: all.database ? '' : 'Start a new query by selecting a database and initial table',
                    query: '',
                    metadata: []
                })
                setColumn('')
                setHistory([])
                setRedoHistory([])
                setQueryedit(all.query)
                setDatabase(all.database ? util.parseDatabaseID(all.database).database : '')
                if (all.database && all.query) {

                    let query = all.query
                    if (all.arguments) {
                        query = util.insertQueryParameterValues(util.transformQueryInfo(all))
                        setQueryedit(query)
                    }

                    setLoading(true)
                    try {
                        const res: QueryResponse = await dataProvider.noop({ database: all.database, query: query })
                        setResponse(res)
                        setQueryedit(res.query)
                    }
                    catch (ex) {
                        notify(util.error(ex), { type: 'error' })
                    }
                    setLoading(false)
                }
            }}
        >Edit Read Query</Button>

        <Dialog open={help} onClose={() => setHelp(false)} maxWidth={false}>
            <Image src='/images/mapping.png' alt='' width={960} height={540}></Image>
        </Dialog>

        <Menu
            anchorEl={anchorEl}
            open={tableMenuOpen}
            onClose={() => setAnchorEl(null)}
        >
            <MenuItem onClick={async () => {
                const base = window.prompt('Enter the new name of the column', column);
                setAnchorEl(null)
                if (base) {
                    setLoading(true)
                    const r: RenameRequest = {
                        database: 'dj/' + database,
                        query: response.query,
                        col: response.metadata[response.fieldNames.indexOf(column)].col,
                        name: base
                    }
                    setResponse2(await dataProvider.rename(r))
                }
            }}><ListItemIcon><Icon>edit</Icon></ListItemIcon><ListItemText>Rename column...</ListItemText></MenuItem>
            <MenuItem onClick={async () => {
                setAnchorEl(null)
                setLoading(true)
                const r: RemoveColumnRequest = {
                    database: 'dj/' + database,
                    query: response.query,
                    col: response.metadata[response.fieldNames.indexOf(column)].col,
                }
                setResponse2(await dataProvider.qeRemoveColumn(r))
            }}><ListItemIcon><Icon>delete</Icon></ListItemIcon><ListItemText>Remove column</ListItemText></MenuItem>
            {column !== '' && util.isValue(response.metadata[response.fieldNames.indexOf(column)]?.groupBy) && (response.metadata[response.fieldNames.indexOf(column)].groupBy !== 'GROUP BY') ?
                <MenuItem disabled><ListItemIcon><Icon>filter_alt</Icon></ListItemIcon>Apply filter (where condition)</MenuItem>
                :
                <NestedMenuItem parentMenuOpen={tableMenuOpen} label='Apply filter (where condition)' leftIcon={<ListItemIcon><Icon sx={{ marginLeft: '0.8rem' }}>filter_alt</Icon></ListItemIcon>}>
                    <MenuItem
                        disabled={response.metadata[response.fieldNames.indexOf(column)]?.where ? false : true}
                        onClick={_ => setWhere(column, undefined)}
                    >Remove</MenuItem>
                    <NestedMenuItem parentMenuOpen={tableMenuOpen} label='Equals (=)'>
                        <SampleMenu sample={tenDistinctValues()} onClick={(selected: any) => setWhere(column, '= ' + selected)}></SampleMenu>
                    </NestedMenuItem>
                    <NestedMenuItem parentMenuOpen={tableMenuOpen} label='Not Equals (<>)'>
                        <SampleMenu sample={tenDistinctValues()} onClick={(selected: any) => setWhere(column, '<> ' + selected)}></SampleMenu>
                    </NestedMenuItem>
                    <NestedMenuItem parentMenuOpen={tableMenuOpen} label='Like'>
                        <SampleMenu sample={tenDistinctValues()} onClick={(selected: any) => setWhere(column, 'like ' + selected)}></SampleMenu>
                    </NestedMenuItem>
                    <MenuItem onClick={(_: any) => setWhere(column, 'is null')}>Is Null</MenuItem>
                    <MenuItem onClick={(_: any) => setWhere(column, 'is not null')}>Is Not Null</MenuItem>
                    <NestedMenuItem parentMenuOpen={tableMenuOpen} label='Smaller (&le;)'>
                        <SampleMenu sample={tenDistinctValues()} onClick={(selected: any) => setWhere(column, '<= ' + selected)}></SampleMenu>
                    </NestedMenuItem>
                    <NestedMenuItem parentMenuOpen={tableMenuOpen} label='Greater (&ge;)'>
                        <SampleMenu sample={tenDistinctValues()} onClick={(selected: any) => setWhere(column, '>= ' + selected)}></SampleMenu>
                    </NestedMenuItem>
                    <NestedMenuItem parentMenuOpen={tableMenuOpen} label='Between'>
                        <DoubleSampleMenu parentMenuOpen={tableMenuOpen} sample={tenDistinctValues()} onClick={(selected: any) => setWhere(column, 'between ' + selected[0] + ' and ' + selected[1])}></DoubleSampleMenu>
                    </NestedMenuItem>
                </NestedMenuItem>}
            <NestedMenuItem parentMenuOpen={tableMenuOpen} label='Apply function (aggregation)' leftIcon={<ListItemIcon><Icon sx={{ marginLeft: '0.8rem' }}>table_view</Icon></ListItemIcon>}>
                <MenuItem onClick={() => setGroupBy(column)}>Remove all</MenuItem>
                <MenuItem onClick={() => setGroupBy(column, 'GROUP BY')}>GROUP BY</MenuItem>
                <MenuItem onClick={() => setGroupBy(column, 'COUNT')}>COUNT</MenuItem>
                <MenuItem onClick={() => setGroupBy(column, 'COUNT DISTINCT')}>COUNT DISTINCT</MenuItem>
                <MenuItem onClick={() => setGroupBy(column, 'MIN')}>MIN</MenuItem>
                <MenuItem onClick={() => setGroupBy(column, 'MAX')}>MAX</MenuItem>
                <MenuItem onClick={() => setGroupBy(column, 'GROUP_CONCAT')}>GROUP_CONCAT</MenuItem>
                <MenuItem onClick={() => setGroupBy(column, 'GROUP_CONCAT DISTINCT')}>GROUP_CONCAT DISTINCT</MenuItem>
                <MenuItem onClick={() => setGroupBy(column, 'AVG')}>AVG</MenuItem>
                <MenuItem onClick={() => setGroupBy(column, 'SUM')}>SUM</MenuItem>
                <MenuItem onClick={() => setGroupBy(column, 'STDDEV')}>STDDEV</MenuItem>
            </NestedMenuItem>
        </Menu>
    </>
}

export default QueryEdit

/**
 * a stripped down version of Value
 * if cell contains JSON, simply stringify
 */
const Cell = ({ data, metadata }: { data: any, metadata: any }) => {
    const schema = metadata?.prop
    if (util.isValue(data) && schema)
        if (util.isValue(schema.pkpos) || schema.ref)
            if (!metadata.groupBy || metadata.groupBy === 'GROUP BY')
                return <LinkValue data={data} prop={util.parseColumnID(schema.ref ? schema.ref : schema.ID!)}></LinkValue>

    if (Array.isArray(data))
        data = JSON.stringify(data)

    if (data && (typeof data === 'object'))
        data = JSON.stringify(data)

    return <Typography component="span">{data}</Typography>
}
