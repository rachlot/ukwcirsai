import Checkbox from '@mui/material/Checkbox';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import { Loading, useGetList } from 'react-admin';
import { HTMLFieldProps, connectField } from 'uniforms';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import { PrintError } from "../components/PrintError";

/**
 * uniforms custom component to select roles
 * feeds the result of useGetList('config/dj-role') into the select options
 */
const Roles = ({ onChange, value }: HTMLFieldProps<string, HTMLDivElement>) => {
    const { data, isLoading, error } = useGetList('config/dj-role', {});
    if (isLoading) return <Loading />
    if (error) return <PrintError error={error}></PrintError>

    return <FormControl fullWidth variant="standard">
        <InputLabel>Show only for roles</InputLabel>
        <Select
            value={value ? value : []}
            multiple
            label='Show only for roles'
            renderValue={(selected) => (selected as any).join(', ')}
            onChange={(x) => onChange(x.target.value as any)}>
            {
                data!.map((i) => <MenuItem key={i.ID} value={i.ID}>
                    <Checkbox checked={value?.includes(i.ID) ? true : false} />
                    <ListItemText primary={i.ID} />
                </MenuItem>)
            }
        </Select>
    </FormControl>
}

export default connectField(Roles)