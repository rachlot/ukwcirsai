import { InputLabel, Select, Icon, IconButton, MenuItem, Stack } from '@mui/material';
import FormControl from '@mui/material/FormControl';
import TextField from '@mui/material/TextField';
import { HTMLFieldProps, connectField } from 'uniforms';
import { util } from '../api/Util';

/**
 * uniforms custom component to create properties map
 */
const Properties = ({ onChange, value }: HTMLFieldProps<any, HTMLDivElement>) => {

    if (!value)
        value = {}

    let i = 0
    return <>
        <InputLabel>Properties</InputLabel>
        {Object.entries(value).map(([k, v]) => <Stack direction={'row'} key={i++}>
            <FormControl variant="standard">
                <TextField
                    value={k}
                    onChange={(x) => util.setKey(onChange, value, k, x.target.value)}
                />
            </FormControl >
            &nbsp;
            &nbsp;
            <FormControl variant="standard">
                <Select
                    sx={{ width: '100px' }}
                    value={v}
                    label='Type'
                    onChange={(x) => util.set(onChange, value, k, x.target.value as any)}>
                    <MenuItem value="boolean">boolean</MenuItem>
                    <MenuItem value="integer">integer</MenuItem>
                    <MenuItem value="number">number</MenuItem>
                    <MenuItem value="string">string</MenuItem>
                    <MenuItem value="date">date</MenuItem>
                    <MenuItem value="upload">upload</MenuItem>
                </Select>
            </FormControl>
            <IconButton onClick={() => util.del(onChange, value, k)}><Icon>remove_circle_outline</Icon></IconButton>
        </Stack>
        )}
        <IconButton
            onClick={() => util.add(onChange, value)}
            sx={{ width: '32px' }}
        ><Icon>add_circle_outline</Icon></IconButton>
    </>
}

export default connectField(Properties)
