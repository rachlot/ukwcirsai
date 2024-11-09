import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import { Loading, useGetOne } from 'react-admin';
import { HTMLFieldProps, connectField } from 'uniforms';
import { PrintError } from "../components/PrintError";
import { useForm } from 'uniforms';

/**
 * uniforms custom component to select Table
 */
const Tables = ({ onChange, value }: HTMLFieldProps<string, HTMLDivElement>) => {

    const form = useForm()
    var database = (form.model as any).database
    const disabled = database ? false : true
    database = disabled ? 'dj/config' : 'dj/' + database

    const { data, isLoading, error } = useGetOne('config/dj-database', { id: database });
    if (isLoading) return <Loading />
    if (error) return <PrintError error={error}></PrintError>

    const data2 = Object.keys(data.tables)

    return <FormControl fullWidth variant="standard">
        <InputLabel id="uniform-table">Table</InputLabel>
        <Select
            disabled={disabled}
            value={value ? value : ''}
            label='Table'
            onChange={(x) => onChange(x.target.value)}>
            {
                data2.map((i) => <MenuItem key={i} value={i}>
                    <ListItemText primary={i} />
                </MenuItem>)
            }
        </Select>
    </FormControl>
}

export default connectField(Tables)