import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import { Loading, useGetList } from 'react-admin';
import { HTMLFieldProps, connectField } from 'uniforms';
import { PrintError } from "../components/PrintError";

/**
 * uniforms custom component to select Databases
 * feeds the result of useGetList('config/dj-database') into the select options
 */
const Databases = ({ onChange, value }: HTMLFieldProps<string, HTMLDivElement>) => {
    const { data, isLoading, error } = useGetList('config/dj-database', {});
    if (isLoading) return <Loading />
    if (error) return <PrintError error={error}></PrintError>

    const data2 = data!.map(x => x.ID.split('/')[1]).filter(x => x !== 'config')

    return <FormControl fullWidth variant="standard">
        <InputLabel id="demo-simple-select-label">Database</InputLabel>
        <Select
            value={value ? value : ''}
            label='Databases'
            onChange={(x) => onChange(x.target.value)}>
            {
                data2.map((i) => <MenuItem key={i} value={i}>
                    <ListItemText primary={i} />
                </MenuItem>)
            }
        </Select>
    </FormControl>
}

export default connectField(Databases)