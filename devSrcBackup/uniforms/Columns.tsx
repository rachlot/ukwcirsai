import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import { Loading, useGetOne } from 'react-admin';
import { HTMLFieldProps, connectField } from 'uniforms';
import { PrintError } from "../components/PrintError";
import { useForm } from 'uniforms';
import { util } from '../api/Util';

/**
 * uniforms custom component to select Column
 */
const Columns = ({ onChange, value }: HTMLFieldProps<string, HTMLDivElement>) => {

    const form = useForm()
    var database = (form.model as any).database
    var table = (form.model as any).table
    const disabled = database && table ? false : true
    database = disabled ? 'dj/config/dj-roles' : 'dj/' + database + '/' + util.encodeTableOrColumnName(table)

    const { data, isLoading, error } = useGetOne('config/Table', { id: database });
    if (isLoading) return <Loading />
    if (error) return <PrintError error={error}></PrintError>

    const data2 = Object.keys(data.properties)

    return <FormControl fullWidth variant="standard">
        <InputLabel id="uniform-table">Column</InputLabel>
        <Select
            disabled={disabled}
            value={value ? value : ''}
            label='Column'
            onChange={(x) => onChange(x.target.value)}>
            {
                data2.map((i) => <MenuItem key={i} value={i}>
                    <ListItemText primary={i} />
                </MenuItem>)
            }
        </Select>
    </FormControl>
}

export default connectField(Columns)