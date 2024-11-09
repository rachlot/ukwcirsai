import Ajv from "ajv"

/**
 * datatype / form description (json-schema)
 */
export interface Schema {

    /**
     * ID if the schema is a DB table or property
     */
    ID?: string

    /**
     * parent if the schema is a DB table or property
     */
    parent?: string

    /**
     * name if the schema is a DB table or property
     */
    name?: string

    /**
     * json schema form widget (e.g. date)
     */
    widget?: string

    /**
     * file upload widget, support nulti file upload
     */
    multiple?: boolean

    /**
     * custom widget type
     */
    widgetType?: string

    /**
     * json schema type
     */
    type: string

    /**
     * json schema title
     */
    title?: string

    /**
     * json schema description
     */
    description?: string

    /**
     * if DB table, optional instance toString / ID label
     */
    'dj-label'?: string

    /**
     * if property, foreign key reference
     */
    ref?: string

    /**
     * if property, primary key position
     */
    pkpos?: number

    /**
     * json schema object properties
     */
    properties?: { [key: string]: Schema }

    /**
     * json schema additional properties
     */
    additionalProperties?: Schema

    /**
     * json schema required object properties
     */
    required?: string[]

    /**
     * json schema pattern
     */
    format?: string

    /**
     * json schema array subschema
     */
    items?: Schema

    /**
     * choices http endpoint
     */
    choicesUrl?: string

    /**
     * choices http verb (POST is default)
     */
    choicesVerb?: string

    /**
     * jsonata expression that transforms http result into choices
     */
    jsonata?: string

    /**
     * jsonata that creates select options
     */
    options?: string

    /**
     * function that allows transforming values to display names (e.g. localName)
     */
    displayWith?: string

    /**
     * indicates that a property controls which form elements to show
     */
    switch?: string

    /**
     * indicates which switch values makes this property input show up
     */
    case?: string[]

    /**
     * 2-dimensional layout array
     */
    order?: (string | string[])[]

    /**
     * widget layout info
     */
    layout?: string

    /**
     * input css style
     */
    style?: { [key: string]: string }

    /**
     * static choices provided
     */
    choices?: any[]
    enum?: any[]
    displayWithChoices?: string[]

    /**
     * widget can be in draft which means visible in layout editor but not in view mode
     */
    isDraft?: boolean,

    /**
     * size of the widget in the current 12-tile layout
     */
    size?: number

    /**
     * field is read only
     */
    readOnly?: boolean

    /**
     * only editable when creating a record
     */
    createOnly?: boolean

    /**
     * form placeholders
     */
    examples?: any[]
}

/**
 * basic validator output: https://json-schema.org/draft/2020-12/json-schema-core.html#name-basic
 */
export interface SchemaError {
    instanceLocation: string
    error: string

    /**
     * special case for required, since validator put the error at the object, not the field
     */
    required?: string
}

/**
 * common validation function
 * @returns list of errors or [] if validated
 */
export function validate(data: any, schema: Schema): SchemaError[] {
    const ajv = new Ajv({ allErrors: true, strictSchema: false });

    const scopy = JSON.parse(JSON.stringify(schema))
    addNull(scopy)

    const dcopy = JSON.parse(JSON.stringify(data))
    dropNull(dcopy)

    const validate = ajv.validate(scopy, dcopy)
    if (validate)
        return []
    else if (!ajv.errors)
        return []
    else
        return ajv.errors.map(e => {
            return {
                error: e.message ? e.message : 'error',
                instanceLocation: e.instancePath,
                required: e.params.missingProperty
            }
        })
}

/**
 * allow null values to indicate that a field is to be deleted
 */
function addNull(schema: Schema) {
    schema.type = ['null', schema.type] as any
    if (schema.properties)
        for (const p of Object.values(schema.properties))
            addNull(p)
}

/**
 * remove all key: null fields
 */
function dropNull(data: any) {
    if (typeof data === ('object'))
        for (const k of Object.keys(data)) {
            if (data[k] === null)
                delete data[k]
            else
                dropNull(data[k])
        }
}