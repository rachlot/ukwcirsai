import { Icon, IconButton, InputLabel, Stack } from '@mui/material';
import FormControl from '@mui/material/FormControl';
import TextField from '@mui/material/TextField';
import { HTMLFieldProps, connectField } from 'uniforms';
import { util } from '../api/Util';

/**
 * uniforms custom component to create Styles map
 */
const Icons = ({ onChange, value }: HTMLFieldProps<any, HTMLDivElement>) => {

    if (!value)
        value = {}

    let i = 0
    return <>
        <InputLabel>Icons</InputLabel>
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
                <TextField
                    value={v}
                    onChange={(x) => util.set(onChange, value, k, x.target.value)}
                />
            </FormControl >
            <IconButton onClick={() => util.del(onChange, value, k)}><Icon>remove_circle_outline</Icon></IconButton>
        </Stack>
        )}
        <IconButton
            onClick={() => util.add(onChange, value)}
            sx={{ width: '32px' }}
        ><Icon>add_circle_outline</Icon></IconButton>
    </>
}

export default connectField(Icons)
