import { Icon } from '@mui/material';
import { useFormContext, useWatch } from 'react-hook-form';
import { description, format, inputtitle, name, options, readOnly, required, style, widget } from "../api/Const";
import { Switch } from "../form/EditForm";
import { Schema } from "../model/schema";

/**
 * wraps the edit "switch" element that delegates to the various input elements
 * and makes it available as a widget such that it can be used in the layout editor
 */
export const Input = ({ widget }: { widget: Schema }) => {
    if (!useFormContext())
        return <>Inputs must be placed within a button, variable, create, or edit widget</>
    else
        return <Input2 widget={widget} />
}

/**
 * caller makes sure we're in a form
 */
const Input2 = ({ widget }: { widget: Schema }) => {
    const value = useWatch()
    const ctx = useFormContext()
    try {

        if (!ctx)
            return <>An input element must be placed within a button, variable, create, or edit widget</>

        const schema = widget
        if (!schema.name)
            // might have just been added
            schema.name = 'field'

        return <Switch schema={schema} value={value?.[schema.name!]}></Switch>
    }
    catch (err: any) {
        if (err.message === "Cannot read properties of null (reading 'control')")
            return <>An input element must be placed within a button, variable, create, or edit widget</>
        throw err
    }
}

export default Input

export const config = {
    id: 'input',
    title: 'Input',
    description: 'Input for button, create, edit and variable',
    version: 1,
    icon: <Icon>input</Icon>,
    controls: {
        type: 'autoform',
        schema: {
            properties: {
                // TODO: add input controls
                name: name,
                title: inputtitle,
                description: description,
                widget: widget,
                options: options,
                style: style,
                readOnly: readOnly,
                required: required,
                format: format
            }
        }
    }
}