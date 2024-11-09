import Autocomplete from '@mui/material/Autocomplete';
import { TextField, TextFieldProps } from "@mui/material";
import { useInput, required, InputProps, InputHelperText } from "react-admin";
import { useController, useWatch } from 'react-hook-form';

/**
 * custom Autocomplete freeSolo field
 * 
 * we need this component, because the RA version (AutocompleteInput) requires explicitly creating new options
 * and does not allow entering for instance a DB URL that is different from the suggestions, or a
 * foreign key to a record that is not yet in the DB
 */
export const AutocompleteFreeSolo = ({ validate, label, disabled, source, choices, style, onInput }:
    { validate: any[], label?: string, disabled?: boolean, source: string, choices: any[], style?: { [key: string]: string }, onInput?: (_: any) => void, onCreate?: (_: any) => void }) => {

    const controller = useController({ name: source, defaultValue: '' })
    const {
        field,
        fieldState: { isTouched, invalid, error },
        formState: { isSubmitted },
        isRequired,
    } = useInput({ source, validate })
    const renderHelperText = ((isTouched || isSubmitted) && invalid);

    // lookup choice name from choices where value === id
    let value = controller.field.value
    choices.map(choice => choice.id === value ? value = choice.name : undefined)

    return <Autocomplete
        // adapt to RA style
        sx={{ width: 190 }}

        // allow free text entry other than the choices
        freeSolo

        // free text entry is selected onBlur
        autoSelect

        disabled={disabled}

        // use choices.names in dropdown
        options={choices.map((choice) => choice.name)}

        // allow parent component to react to changed filter (need special handling for clear event which would be ignored otherwise)
        onInput={onInput}
        onInputChange={(a, b, action) => (onInput && action === 'clear') ? onInput({ target: { value: '' } }) : undefined}

        renderInput={(params) => <TextField {...params}
            label={label}
            error={(isTouched || isSubmitted) && invalid}
            helperText={
                renderHelperText ? (
                    <InputHelperText
                        touched={isTouched || isSubmitted}
                        error={error?.message}
                    />
                ) : null
            }
            required={isRequired}
        />}
        style={style}

        // translate choice to its id
        onChange={(_, newValue) => {
            for (const choice of choices)
                if (choice.name === newValue) {
                    controller.field.onChange(choice.id)
                    return
                }
            controller.field.onChange(newValue)
        }}
        value={value}
    />
}
