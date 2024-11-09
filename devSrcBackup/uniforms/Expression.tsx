import FormControl from '@mui/material/FormControl';
import TextField from '@mui/material/TextField';
import { HTMLFieldProps, connectField } from 'uniforms';
import ExpressionPreview from '../components/ExpressionPreview';
import { useExpressionContext } from '../hooks/useExpressionContext';
import { useState } from 'react';
import { render } from '../api/Render';

/**
 * uniforms custom component to preview expression results
 */
const Expression = ({ label, onChange, value }: HTMLFieldProps<string, HTMLDivElement>) => {

    if (!value)
        value = ''

    // preview is empty initially, only set when run is clicked or CTRL enter pressed
    const [preview, setPreview] = useState('')

    // input is the form input (not passed to form yet)
    const [input, setInput] = useState(value)

    const context = useExpressionContext()

    return <FormControl fullWidth variant="standard">
        <TextField
            label={label + ' (CTRL Enter to preview)'}
            value={input}
            multiline={true}
            onBlur={(x) => {
                onChange(x.target.value)
                setPreview(x.target.value)
                setTimeout(() => {
                    render.editingJsonata = false
                }, 1000);
            }}
            onChange={(x) => {
                render.editingJsonata = true
                setInput(x.target.value)
            }}
            onKeyDown={(e: any) => e.ctrlKey && e.key === 'Enter' ? setPreview(input) : ''}
            inputProps={{ style: { fontFamily: 'monospace', fontSize: 'small' } }}
        />
        <ExpressionPreview expression={preview} context={context} foreach={false}></ExpressionPreview>
    </FormControl >
}

export default connectField(Expression)
