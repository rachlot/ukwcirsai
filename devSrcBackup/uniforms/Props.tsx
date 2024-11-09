import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import { Loading, useGetList } from 'react-admin';
import { HTMLFieldProps, connectField } from 'uniforms';
import { useSchema } from '../hooks/useSchema';
import { util } from "../api/Util";
import { PrintError } from "../components/PrintError";

/**
 * uniforms custom component to select Edit Related Props
 */
const Props = (props: HTMLFieldProps<string, HTMLDivElement>) => {
    const { data, isLoading, error } = useSchema()
    if (isLoading) return <Loading />
    if (error) return <PrintError error={error}></PrintError>

    const pk = util.getPrimaryKey(data)

    return <Props2 {...props} field={pk?.ID}></Props2>
}

const Props2 = ({ onChange, value, field }: HTMLFieldProps<string, HTMLDivElement>) => {
    const { data, isLoading, error } = useGetList('config/Property', { filter: { ref: field } });
    if (isLoading) return <Loading />
    if (error) return <PrintError error={error}></PrintError>

    const data2 = data!.map(x => x.ID)

    return <FormControl fullWidth variant="standard">
        <InputLabel id="demo-simple-select-label">Property</InputLabel>
        <Select
            value={value ? value : ''}
            label='Property'
            onChange={(x) => onChange(x.target.value)}>
            {
                data2.map((i) => <MenuItem key={i} value={i}>
                    <ListItemText primary={i} />
                </MenuItem>)
            }
        </Select>
    </FormControl>
}

export default connectField(Props)