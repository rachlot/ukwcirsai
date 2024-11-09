import FormControl from '@mui/material/FormControl';
import Icon from '@mui/material/Icon';
import IconButton from '@mui/material/IconButton';
import ImageList from '@mui/material/ImageList';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import { HTMLFieldProps, connectField } from 'uniforms';
import { icons } from '../api/Icons';

/**
 * uniforms custom component to select icon
 */
const IconPicker = ({ onChange, value }: HTMLFieldProps<string, HTMLDivElement>) => {
    return <FormControl fullWidth variant="standard">
        <TextField
            label="Icon"
            value={value}
            onChange={(x) => onChange(x.target.value)}
        />
        <ImageList cols={8} rowHeight={16}>
            {icons.getIcons(value).map(i =>
                <Tooltip key={i} title={i}>
                    <IconButton sx={{ width: '16px' }} onClick={x => onChange(i.split('::')[1])}><Icon>{i.split('::')[1]}</Icon></IconButton>
                </Tooltip>
            )}
        </ImageList>
    </FormControl >
}

export default connectField(IconPicker)
