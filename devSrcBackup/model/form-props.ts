import { Schema, SchemaError } from "./schema";

/**
 * common form input
 */
export interface FormProps {

    /**
     * the form data
     */
    data: any,

    /**
     * the underlying schema
     */
    schema: Schema,

    /**
     * according to the parent schema, is this part required
     */
    required?: boolean,

    /**
     * name of this part in the parent
     */
    name: string,

    /**
     * notify the parent about a value change: onChange(name, newvalue)
     */
    onChange: (name: string, value: any) => void,

    /**
     * a list of validation errors that occurred in this subschema
     */
    error: SchemaError[]
}