import { Icon } from '@mui/material'
import { title } from '../api/Const'
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import { useState } from 'react';
import { useDataProvider, useNotify } from 'react-admin';
import { useLoc } from '../hooks/useLoc';
import { util } from '../api/Util';
import Tabs from '@mui/material/Tabs';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import { AntTab } from '../components/AntTab';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import { render } from '../api/Render';
import { api } from '../api/Api';

declare module 'react' {
    interface InputHTMLAttributes<T> extends HTMLAttributes<T> {
        // extends React's HTMLAttributes
        webkitdirectory?: string;
    }
}

export const Upload = () => {

    const notify = useNotify()
    const loc = useLoc()
    const dataProvider = useDataProvider()

    // dialog open state
    const [open, setOpen] = useState(false)

    // tab state
    const [value, setValue] = useState(0);

    // detect result
    const [dr, setDr] = useState<DetectResult>({ initial: true, createMode: false, schema: { '': [{ name: '', pk: true, type: '', sample: ['', '', '', '', '', '', '', '', '', ''] }] } })

    // upload file state
    const [formData, setFormData] = useState<FormData>()

    const upload = async (files: FileList) => {
        if (files.length === 0) {
            return;
        }

        let total = 0;
        for (let i = 0; i < files.length; i++) {
            total = total + files.item(i)!.size;
        }

        // limit to 10 MB
        if (total > 10 * 1024 * 1024) {
            notify('Uploads are limited to 10MB', { type: 'warning' });
            return;
        }

        const formData = new FormData();
        for (let i = 0; i < files.length; i++) {
            const path = (files.item(i) as any).webkitRelativePath ?
                (files.item(i) as any).webkitRelativePath : files.item(i)!.name;
            formData.append('file', files.item(i)!, encodeURIComponent(path));
        }

        setDr(await dataProvider.upload('detect', util.parseDatabaseID(loc.id!).database, formData))
        setFormData(formData)
    }

    let i = 0

    return <>
        <Dialog open={open} onClose={() => setOpen(false)} maxWidth={false}>
            <DialogContent>
                Provide .csv, .xlsx, .sqlite or .json: &nbsp;
                <Button variant="contained" component="label">
                    Upload Files...
                    <input hidden multiple type="file" onChange={async event => {
                        if (event.target.files)
                            try {
                                await upload(event.target.files)
                            } catch (err) {
                                notify(util.error(err), { type: 'error' })
                            }
                    }} />
                </Button>
                &nbsp;
                <Button variant="contained" onClick={async () => {
                    const url = prompt('Download data from this URL')
                    if (url) {
                        if (url.includes('"')) {
                            notify('URL must not contain quotes')
                            return
                        }
                        const parts = new URL(url).pathname.split('/')
                        const filename = parts[parts.length - 1]
                        try {
                            const base64 = await dataProvider.expression('$openText("' + url + '", "BASE_64")')
                            const f = await fetch('data:;base64,' + base64)
                            const blob = await f.blob()
                            const file = new File([blob], filename)
                            if (file.size > 10 * 1024 * 1024) {
                                notify('Uploads are limited to 10MB', { type: 'warning' });
                                return;
                            }
                            const formData = new FormData();
                            const path = (file as any).webkitRelativePath ?
                                (file as any).webkitRelativePath : file.name;
                            formData.append('file', file, encodeURIComponent(path));
                            setDr(await dataProvider.upload('detect', util.parseDatabaseID(loc.id!).database, formData))
                            setFormData(formData)
                        } catch (err) {
                            notify(util.error(err), { type: 'error' })
                        }
                    }
                }}>Provide a URL...</Button>
                {loc.database === 'config' && loc.id === 'dj/config' ? <>&nbsp;<Button variant="contained" component="label">
                    Upload model folder...
                    <input hidden multiple webkitdirectory='' type="file" onChange={async event => {
                        if (event.target.files)
                            try {
                                await upload(event.target.files)
                            } catch (err) {
                                notify(util.error(err), { type: 'error' })
                            }
                    }} />
                </Button></>
                    : <></>}
                <Tabs value={value} onChange={(event, pos) => setValue(pos)}>
                    {Object.entries(dr.schema).map(([k, v]) => {
                        return <AntTab key={i++} label={k} />
                    })}
                </Tabs>
                {Object.entries(dr.schema).map(([k, v]) => {
                    return <div key={i++} hidden={Object.keys(dr.schema).indexOf(k) !== value}>
                        <RadioGroup value={v.reduce((acc, curr) => curr.pk ? curr : acc, {} as TypeSample).name} onChange={e => {
                            for (const col of v)
                                col.pk = (col.name === e.target.value)
                            setDr({ ...dr })
                        }}>
                            <Table size='small' sx={{ width: '80vw' }}>
                                <TableHead>
                                    <TableRow>
                                        {v.map(c => { return <TableCell key={i++}>{c.name}</TableCell> })}
                                    </TableRow>
                                    <TableRow>
                                        {v.map(c => {
                                            return <TableCell key={i++}>
                                                <FormControlLabel value={c.name} control={<Radio size='small' />} label={<span style={{ fontSize: 'small' }}>Primary key</span>} />
                                            </TableCell>
                                        })}
                                    </TableRow>
                                    <TableRow>
                                        {v.map(c => {
                                            return <TableCell key={i++}>
                                                <FormControl variant="standard" fullWidth size="small">
                                                    <Select value={c.type} onChange={e => {
                                                        c.type = e.target.value
                                                        setDr({ ...dr })
                                                    }}>
                                                        <MenuItem value={'number'}>number</MenuItem>
                                                        <MenuItem value={'integer'}>integer</MenuItem>
                                                        <MenuItem value={'boolean'}>boolean</MenuItem>
                                                        <MenuItem value={'string'}>string</MenuItem>
                                                        <MenuItem value={'date'}>date</MenuItem>
                                                    </Select>
                                                </FormControl>
                                            </TableCell>
                                        })}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(row => {
                                        return <TableRow key={i++}>
                                            {v.map(c => {
                                                return <TableCell sx={{ overflowX: 'hidden', whiteSpace: 'nowrap', maxWidth: 300 }} key={i++}>{c.sample[row] ? c.sample[row] : <>&nbsp;</>}</TableCell>
                                            })}
                                        </TableRow>
                                    })}
                                </TableBody>
                            </Table>
                        </RadioGroup>
                    </div>
                })}
            </DialogContent>
            <DialogActions>
                <Button variant="contained" onClick={() => setOpen(false)}>Cancel</Button>
                <Button disabled={dr.initial || dr.createMode === false} variant="contained" onClick={async () => {
                    formData!.append('__dj_schema', JSON.stringify(dr.schema));
                    try {
                        notify('Working...')
                        await dataProvider.upload('create', util.parseDatabaseID(loc.id!).database, formData)
                        api.clearCache()
                        render.setDdl()
                        notify('Done')
                    } catch (err) {
                        notify(util.error(err), { type: 'error' })
                    }
                    setOpen(false)
                }}>Create</Button>
                <Button disabled={dr.initial || dr.createMode === true} variant="contained" onClick={async () => {
                    const confirm = prompt('You are replacing the contents of the tables: ' + Object.keys(dr.schema) + '. The current contents of these tables will be deleted. This operation cannot be reverted! Confirm by entering "delete contents"')
                    if (confirm === 'delete contents') {
                        try {
                            notify('Working...')
                            await dataProvider.upload('replace', util.parseDatabaseID(loc.id!).database, formData)
                            notify('Done')
                        } catch (err) {
                            notify(util.error(err), { type: 'error' })
                        }
                        setOpen(false)
                    }
                }}>Replace...</Button>
                <Button disabled={dr.initial || dr.createMode === true} variant="contained" onClick={async () => {
                    try {
                        notify('Working...')
                        await dataProvider.upload('append', util.parseDatabaseID(loc.id!).database, formData)
                        notify('Done')
                    } catch (err) {
                        notify(util.error(err), { type: 'error' })
                    }
                    setOpen(false)
                }}>Append</Button>
            </DialogActions>
        </Dialog>
        <Stack spacing={2} direction="row">
            <Button
                variant="contained"
                onClick={async () => {
                    setDr({ initial: true, createMode: false, schema: { '': [{ name: '', pk: true, type: '', sample: ['', '', '', '', '', '', '', '', '', ''] }] } })
                    setOpen(true)
                }}
            >Upload Data</Button>
        </Stack>
    </>
}

export default Upload

/**
 * Metadata
 */
export const config = {
    id: 'upload',

    // capitalized version
    title: 'Upload',

    // description in widget chooser
    description: 'Upload to database',
    version: 1,

    // hidden in the left drawer
    hideInMenu: true,

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

interface DetectResult {

    /**
     * initial data
     */
    initial: boolean

    /**
     * true: tables will be created, false: tables can be appended / replaced
     */
    createMode: boolean

    /**
     * map: tablename - tableinfo which is List of column infos
     */
    schema: { [key: string]: TypeSample[] }
}

interface TypeSample {
    /**
     * column name
     */
    name: string

    /**
     * column type (string, integer, number, date, string)
     */
    type: string

    /**
     * first 10 values
     */
    sample: any[]

    /**
     * suggested as a PK
     */
    pk: boolean
}
