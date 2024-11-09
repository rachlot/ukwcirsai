import TextField from '@mui/material/TextField';
import { useState } from 'react';

/**
 * shows a textfield + preview for editing an expression
 * the change is sent onBlur (i.e. when the user leaves the textfield)
 */
const MappingExpression = ({ value, sample, onChange }: { value: string, sample: any, onChange: Function }) => {

    const [expression, setExpression] = useState(value)

    return <>
        <TextField
            inputProps={{ style: { fontSize: 'small', fontFamily: 'monospace' } }}
            variant="standard"
            value={expression}
            onChange={(e) => setExpression(e.target.value)}
            onBlur={() => onChange(expression)}
            onMouseOver={e => {
                if (document.activeElement !== e.target)
                    if (value !== expression)
                        setExpression(value)
            }}
        />
    </>
    // removed in order to provide consistency in how previews are handled
    // <ExpressionPreview expression={expression} context={sample} foreach={false}></ExpressionPreview>
}

export default MappingExpression