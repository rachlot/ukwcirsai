import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import { useState } from 'react';

/**
 * shows a textfield for the where filter
 * the change is sent onBlur (i.e. when the user leaves the textfield)
 */
const FilterExpression = ({ value, onChange, disabled, options }: { value: string, onChange: Function, disabled: boolean, options: any[] }) => {

    const [where, setWhere] = useState(value)

    return <>
        <Autocomplete
            freeSolo
            disabled={disabled}
            options={options.map(o => typeof o === 'number' || typeof o === 'boolean' ? o + '' : o)}
            value={where ? where : ''}
            onChange={(_, newvalue) => onChange(typeof newvalue === 'string' ? "'" + newvalue + "'" : newvalue)}
            renderInput={(params: any) => (
                <TextField
                    {...params}
                    variant="standard"
                    sx={{ width: '100%' }}
                    onChange={(e) => setWhere(e.target.value)}
                    onBlur={() => onChange(where)}
                    InputProps={{
                        ...params.InputProps,
                        style: { fontSize: 'small', fontFamily: 'monospace' }
                    }}
                />
            )}
        />
    </>
}

export default FilterExpression