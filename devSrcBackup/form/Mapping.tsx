import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import FormControlLabel from '@mui/material/FormControlLabel';
import Icon from '@mui/material/Icon';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Tabs from '@mui/material/Tabs';
import Image from 'next/image';
import { useState } from 'react';
import { useDataProvider, useNotify } from 'react-admin';
import { useController, useWatch } from 'react-hook-form';
import { util } from '../api/Util';
import { AntTab } from '../components/AntTab';
import { Result } from '../model/result';
import MappingExpression from './MappingExpression';
import Tooltip from '@mui/material/Tooltip';

/**
 * mapping editor 
 */
const Mapping = () => {

    const notify = useNotify()

    // backend mapping API
    const dataProvider = useDataProvider()

    // access to current form value
    const all = useWatch()

    // link to the RA form
    const mappings = useController({ name: 'mappings' })

    // warning display
    const [warning, setWarning] = useState<string | undefined>()

    // dialog open state
    const [open, setOpen] = useState(false)

    // help dialog open state
    const [help, setHelp] = useState(false)

    // loading state
    const [loading, setLoading] = useState(false)

    // mapping result state
    const [result, setResult] = useState<Result>({
        source: {},
        columns: {},
        datatypes: {},
        result: {},
        createSchema: false,
    })

    // called after data provider calls
    const setResult2 = (res: Result) => {
        setHistory([...history, result]);
        setRedoHistory([]);
        setWarning(res.warning)
        setResult(res)
        setLoading(false)
    }

    // undo / redo
    const [history, setHistory] = useState<Result[]>([]);
    const [redoHistory, setRedoHistory] = useState<Result[]>([]);

    // tab state
    const [tab, setTab] = useState(0);

    // get the current table
    const table = (): string => Object.keys(result.result)[tab]

    // table menu
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const tableMenuOpen = Boolean(anchorEl);

    // column menu
    const [anchorElCol, setAnchorElCol] = useState<null | HTMLElement>(null);
    const colMenuOpen = Boolean(anchorElCol);
    const [column, setColumn] = useState('');

    // add column menu
    const [anchorElAddCol, setAnchorElAddCol] = useState<null | HTMLElement>(null);
    const addColMenuOpen = Boolean(anchorElAddCol);

    /**
     * get the current table and current column's expression for editing
     */
    const getExpression = (table: string, column: string) => {
        if (result.mappings?.[table]?.rowMapping) {
            return result.mappings[table].rowMapping![column];
        } else {
            if (isAlphaNumeric(column)) {
                return column;
            } else {
                return '$."' + column + '"';
            }
        }
    }

    /**
     * get the current table's source table
     */
    const getSourceTable = (table: string): string => {
        if (result.mappings?.[table]?.sourceTable)
            return result.mappings[table].sourceTable!
        else
            return table
    }

    /**
     * true if ch consists of only numbers or letters
     */
    const isAlphaNumeric = (ch: string) => {
        if (!ch) {
            return true;
        }
        return ch.match(/^[a-z0-9_]+$/i) !== null;
    }

    /**
     * compute column missing in the current mapping
     */
    const addableColumns = (table: string): string[] => {

        // default 1:1 mappings with all columns included
        if (!result.mappings?.[table]?.rowMapping) {
            return ['add computed column'];
        }

        // child table
        if (result.mappings?.[table]?.childTable) {
            return ['add computed column'];
        }

        // source table name
        const source = util.isValue(result.mappings?.[table]?.sourceTable) ? result.mappings?.[table].sourceTable : table;

        // compute the available columns
        const set = new Set<string>();
        set.add('add computed column');
        for (const row of result.source[source!]) {
            for (const col of Object.keys(row)) {
                set.add(col);
            }
        }

        // remove the columns used in 1:1 mappings
        if (result.mappings?.[table]?.rowMapping)
            for (const col of Object.values(result.mappings[table].rowMapping!)) {
                set.delete(col);
                if (col.startsWith('$."') && col.endsWith('"')) {
                    set.delete(col.substring(3, col.length - 1));
                }
            }

        return Array.from(set);
    }

    // component key
    let counter = 0

    return <>
        <Dialog open={open} onClose={() => setOpen(false)} maxWidth={false}>
            <DialogContent>
                <LinearProgress variant={loading ? "indeterminate" : "determinate"} value={0} sx={{ marginBottom: '0.5rem' }} />
                <Button disabled={history.length === 0} sx={{ paddingLeft: '28px' }} variant='contained' startIcon={<Icon>undo</Icon>} onClick={() => {
                    setRedoHistory([...redoHistory, result])
                    const res = history.pop()
                    setHistory([...history])
                    setResult(res!)
                }}></Button>
                &nbsp;
                <Button disabled={redoHistory.length === 0} sx={{ paddingLeft: '28px' }} variant='contained' startIcon={<Icon>redo</Icon>} onClick={() => {
                    setHistory([...history, result])
                    const res = redoHistory.pop()
                    setRedoHistory([...redoHistory])
                    setResult(res!)
                }}></Button>
                &nbsp;
                <Button disabled={!result.result[table()]} sx={{ paddingLeft: '28px' }} variant='contained' startIcon={<Icon>cloud_download</Icon>} onClick={() => util.downloadCsv(result.result[table()])}></Button>
                &nbsp;
                <Button sx={{ paddingLeft: '28px' }} variant='contained' startIcon={<Icon>help</Icon>} onClick={() => {
                    setHelp(true)
                }}></Button>

                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={tab} onChange={(_, newValue: number) => setTab(newValue)}>
                        {/* causes validateDOMNesting(...) warning */}
                        {Object.keys(result.result).map(x => <AntTab
                            icon={<IconButton
                                sx={{ background: 'lightcoral' }}
                                onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
                                    setAnchorEl(event.currentTarget);
                                }}
                            ><Icon>more_vert</Icon></IconButton>}
                            iconPosition="start"
                            key={counter++}
                            label={x}
                        />)}
                        <IconButtonInTabs onClick={async () => {
                            const options = Object.keys(result.source);
                            let base;
                            if (options.length === 1) {
                                base = options[0]
                            } else {
                                do {
                                    base = window.prompt('Enter the name of the base table (one of ' + options.join(', ') + ')', Object.keys(result.source)[0]);
                                } while (base && !options.includes(base))
                            }
                            if (base) {
                                setLoading(true)
                                setResult2(await dataProvider.addTable(result, base))
                            }
                        }}><Icon>add</Icon></IconButtonInTabs>
                    </Tabs>
                </Box>
                {Object.entries(result.columns).map(([key, value]) => <div
                    role="tabpanel"
                    hidden={table() !== key}
                    key={counter++}
                    style={{ width: '100%', overflowX: 'auto' }}
                >
                    <RadioGroup
                        value={result.mappings?.[key]?.pk ? result.mappings[key].pk : ''}
                        onChange={(x) => {
                            const res = { ...result }
                            if (!res.mappings) {
                                res.mappings = {};
                            }
                            if (!res.mappings[key]) {
                                res.mappings[key] = {}
                            }
                            res.mappings[key].pk = x.target.value;
                            setResult(res)
                        }}
                    >
                        <table style={{ fontSize: 'small' }}>
                            <tbody>
                                <tr>
                                    {value.map(col => <td key={counter++} style={{ maxWidth: '300px', whiteSpace: 'nowrap', verticalAlign: 'top' }}>
                                        <IconButton
                                            sx={{ background: 'lightgreen' }}
                                            onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
                                                setColumn(col)
                                                setAnchorElCol(event.currentTarget);
                                            }}
                                        ><Icon>more_vert</Icon></IconButton>
                                        &nbsp;
                                        {col}
                                        <br></br>
                                        <MappingExpression
                                            value={getExpression(key, col)}
                                            sample={result.source[getSourceTable(key)]?.length > 0 ? result.source[getSourceTable(key)][0] : {}}
                                            onChange={async (e: any) => {
                                                setLoading(true)
                                                try {
                                                    setResult2(await dataProvider.setExpression(result, key, col, e))
                                                }
                                                catch (ex) {
                                                    notify(util.error(ex), { type: 'error' })
                                                    setLoading(false)
                                                }
                                            }}
                                        />
                                    </td>)}
                                    <td style={{ verticalAlign: 'top' }}>
                                        <IconButton
                                            sx={{ background: 'lightgreen' }}
                                            onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
                                                setAnchorElAddCol(event.currentTarget);
                                            }}
                                        ><Icon>more_vert</Icon></IconButton>
                                    </td>
                                </tr>
                                <tr>
                                    {value.map(col => <td key={counter++} style={{ maxWidth: '300px', whiteSpace: 'nowrap', verticalAlign: 'top' }}>
                                        type: {result.datatypes[key][value.indexOf(col)]}
                                        <br></br>
                                        <FormControlLabel value={col} control={<Radio size='small' />} label={<span style={{ fontSize: 'small' }}>Primary key</span>} />
                                    </td>)}
                                </tr>
                                {result.result[key].map(row => <tr key={counter++}>
                                    {result.columns[key].map((col: any) => <td key={counter++} style={{ maxWidth: '300px', overflowX: 'hidden', whiteSpace: 'nowrap', borderTop: '1px solid #0000001f' }}>
                                        {Array.isArray(row[col]) || util.isObject(row[col]) ?
                                            <Tooltip title={<pre>{JSON.stringify(row[col], null, 2)}</pre>}><span>{JSON.stringify(row[col])}</span></Tooltip> :
                                            row[col]
                                        }
                                    </td>)}
                                </tr>)}
                            </tbody>
                        </table>
                    </RadioGroup>
                </div>)}
                <p style={{ color: 'red' }}>{warning}</p>
            </DialogContent>
            <DialogActions>
                <Button sx={{ marginRight: '100px' }} variant="contained" onClick={async () => {
                    setLoading(true)
                    setResult2(await dataProvider.resetMappings(result))
                }}>Reset all Mappings</Button>
                <Button onClick={() => setOpen(false)}>Cancel</Button>
                <Button variant="contained" onClick={() => {
                    mappings.field.onChange(result.mappings)
                    setOpen(false)
                }}>Ok</Button>
            </DialogActions>
        </Dialog >
        <Button
            variant="contained"
            onClick={async () => {
                setOpen(true)
                setResult({
                    source: {},
                    columns: {},
                    datatypes: {},
                    result: {},
                    createSchema: false,
                })
                setHistory([])
                setRedoHistory([])
                setLoading(true)
                try {
                    const res = (await dataProvider.gather(all.ID, all))
                    setWarning(res.warning)
                    setResult(res)
                }
                catch (ex) {
                    notify(util.error(ex), { type: 'error' })
                }
                setLoading(false)
            }}
        >Preview Data & Edit Mappings</Button>

        <Menu
            anchorEl={anchorEl}
            open={tableMenuOpen}
            onClose={() => setAnchorEl(null)}
        >
            <MenuItem onClick={async () => {
                const base = window.prompt('Enter the new name of the table', table());
                setAnchorEl(null)
                if (base) {
                    setLoading(true)
                    setResult2(await dataProvider.renameTable(result, table(), base))
                }
            }}><ListItemIcon><Icon>edit</Icon></ListItemIcon><ListItemText>Rename table...</ListItemText></MenuItem>
            <MenuItem onClick={async () => {
                setAnchorEl(null)
                if (tab === Object.keys(result.result).length - 1)
                    if (tab > 0)
                        setTab(tab - 1)
                setLoading(true)
                setResult2(await dataProvider.removeTable(result, table()))
            }}><ListItemIcon><Icon>delete</Icon></ListItemIcon><ListItemText>Remove table</ListItemText></MenuItem>
        </Menu>

        <Menu
            anchorEl={anchorElCol}
            open={colMenuOpen}
            onClose={() => setAnchorElCol(null)}
        >
            <MenuItem onClick={async () => {
                const base = window.prompt('Enter the new name of the column', column)
                setAnchorElCol(null)
                if (base) {
                    setLoading(true)
                    setResult2(await dataProvider.renameColumn(result, table(), column, base))
                }
            }}><ListItemIcon><Icon>edit</Icon></ListItemIcon><ListItemText>Rename column ...</ListItemText></MenuItem>
            <MenuItem onClick={async () => {
                setAnchorElCol(null)
                setLoading(true)
                setResult2(await dataProvider.removeColumn(result, table(), column))
            }}><ListItemIcon><Icon>edit</Icon></ListItemIcon><ListItemText>Remove column</ListItemText></MenuItem>
            <MenuItem onClick={async () => {
                setAnchorElCol(null)
                setLoading(true)
                setResult2(await dataProvider.extractTable(result, table(), column))
            }}><ListItemIcon><Icon>delete</Icon></ListItemIcon><ListItemText>Extract to table</ListItemText></MenuItem>
        </Menu>

        <Menu
            anchorEl={anchorElAddCol}
            open={addColMenuOpen}
            onClose={() => setAnchorElAddCol(null)}
        >
            {addableColumns(table()).map(x => <MenuItem key={counter++} onClick={async () => {
                setAnchorElAddCol(null)
                setResult2(await dataProvider.addColumn(result, table(), x))
            }}><ListItemIcon><Icon>add_circle</Icon></ListItemIcon><ListItemText>{x}</ListItemText></MenuItem>)}
        </Menu>

        <Dialog open={help} onClose={() => setHelp(false)} maxWidth={false}>
            <Image src='/images/mapping.png' alt='' width={960} height={540}></Image>
        </Dialog>
    </>
}

/**
 * avoid tabs CSS properties to be passed to IconButton
 */
const IconButtonInTabs = ({ onClick, children }: { onClick: any, children: any }) => {
    return <IconButton onClick={onClick}>{children}</IconButton>
};

export default Mapping

