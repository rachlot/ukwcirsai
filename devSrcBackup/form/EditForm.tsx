import { useEditContext, FormDataConsumer } from "ra-core"
import { ReferenceInput, DeleteButton, AutocompleteInput, BooleanInput, TimeInput, DateTimeInput, DateInput, ArrayInput, Loading, PasswordInput, NumberInput, SaveButton, SelectArrayInput, SelectInput, SimpleForm, SimpleFormIterator, TextInput, Toolbar } from "ra-ui-materialui"
import { useWatch, useFormState } from "react-hook-form"
import { util } from "../api/Util"
import { useChoices } from "../hooks/useChoices"
import { Schema } from "../model/schema"
import Todo from "../components/Todo"
import StreamExpression, { ConfigExpression, Expression } from "./StreamExpression"
import Mapping from "./Mapping"
import { useContext, useEffect, useState } from "react"
import { useDebounce } from '../hooks/useDebounce';
import { useDataProvider } from 'react-admin';
import { Choice } from "../model/choice"
import QueryEdit from "./QueryEdit"
import { PrintError } from "../components/PrintError"
import Upload from "./Upload"
import Tooltip from '@mui/material/Tooltip';
import { required, regex, useNotify, useResourceContext, useGetOne } from 'react-admin';
import Box from '@mui/material/Box';
import { useLoc } from "../hooks/useLoc"
import { AutocompleteFreeSolo } from "../components/AutocompleteFreeSolo"
import { Widget } from "../model/widget"
import { InputLabel, Select, Icon, IconButton, MenuItem, Stack } from '@mui/material';
import FormControl from '@mui/material/FormControl';
import TextField from '@mui/material/TextField';
import { useController } from 'react-hook-form';
import InputAdornment from '@mui/material/InputAdornment';
import { DisabledContext } from "../widgets/Button"
import { ThemeProvider } from '@mui/material/styles';
import defaultTheme from '../styles/theme/defaultTheme'

/**
 * edit form for given schema
 */
export const EditForm = ({ widget, children, schema, label, transform }: { widget?: Widget, children: any, schema?: Schema, label?: string, transform?: (data: any) => any }) => {
    if(label === "Run")
        return <SimpleForm toolbar={<></>}><Properties schema={schema}>{children}</Properties></SimpleForm>

    return <SimpleForm toolbar={<EditToolbar widget={widget} label={label} transform={transform} ></EditToolbar>}><Properties schema={schema}>{children}</Properties></SimpleForm>
}
/**
 * we can use useWatch and have access to action handlers here
 */
const EditToolbar = ({ widget, label, transform }: { widget?: Widget, label?: string, transform?: (data: any) => any }) => {
    const resource = useResourceContext()
    const loc = useLoc()
    const disabled = useContext(DisabledContext)
    return <Toolbar sx={{ "&.RaToolbar-mobileToolbar": { position: 'static' } }} style={{backgroundColor: 'transparent', justifyContent: 'flex-end', paddingRight: '-0px', display: 'flex', flex: 1}}>
        <SaveButton
            disabled={disabled}
            style={{backgroundColor: "#65558F", borderRadius: '20px'
            }}
            icon={label ? <></> : undefined}
            label={label ? label : 'Save'}
            alwaysEnable={!disabled}
            transform={data => {
                data = util.handleDots(data)
                data = util.handleKeyValue(data)
                return transform ? transform(data) : data
            }} type="button" />
        &nbsp;&nbsp;

        {widget?.noDelete === true ? <></> : < DeleteButton
            redirect={resource === 'config/Table' ? () => 'config/dj-database/dj%2F' + loc.database : util.getRedirect(widget?.deleteRedirect)}
            mutationMode={resource === 'config/Table' || resource === 'config/Property' || widget?.deleteConfirmation ? 'pessimistic' : 'undoable'}
        ></DeleteButton>
        }
    </Toolbar >

}

/**
 * renders object properties
 */
const Properties = ({ schema, children }: { schema?: Schema, children: any }) => {
    const value = useWatch()
    // console.log(value)

    if (!schema)
        schema = { type: 'object', properties: {} }

    if (schema.required)
        for (const r of schema.required)
            schema.properties![r].required = true as any

    // make sure nested types have property name set
    for (const [n, p] of Object.entries(schema.properties!))
        p.name = n

    let props: any[][] = [[]]

    if (schema.order)
        for (const o of schema.order)
            if (typeof o === 'string')
                props.push([schema.properties![o]])
            else {
                let row = []
                for (const c of o)
                    row.push(schema.properties![c])
                props.push(row)
            }
    else
        props = Object.values(schema.properties!).map(prop => [prop])

    if (schema.switch) {
        const _switch = value[schema.switch]
        props = props.map(row => row.filter(p => p.case === undefined || p.case?.includes(_switch)))
    }

    let i = 0
    return <>
        {props.map(row => <Stack key={i++} direction={'row'}>
            {row.map(p => <Box key={i++} sx={{ paddingRight: '10px' }}>
                <Switch schema={p} value={value?.[p.name!]}></Switch>
            </Box>)}
        </Stack>)}
        {children}
    </>
}

/**
 * optionally add tooltip
 */
export const Switch = ({ schema, value }: { schema: Schema, value: any }) => {
    if (schema.description)
        return <Tooltip title={schema.description} placement="right">
            <span>
                <SwitchInner schema={schema} value={value}></SwitchInner>
            </span>
        </Tooltip>
    else
        return <SwitchInner schema={schema} value={value}></SwitchInner>
}

/**
 * switch to the appropriate subcomponent
 */
export const SwitchInner = ({ schema, value }: { schema: Schema, value: any }) => {

    const [original] = useState(value)

    const disabled = schema.readOnly || (schema.createOnly && util.isValue(original))
    const def = <ThemeProvider theme={defaultTheme}><TextInput size="medium" variant='outlined' style={styles.regularTextField} placeholder={schema.examples?.[0]} validate={validate(schema)} label={util.title(schema)} disabled={disabled} source={schema.name!} multiline={schema.widget === 'textarea'} rows={schema.widget === 'textarea' ? 9 : 1} inputProps={{ style: util.style(schema.style) }} /></ThemeProvider>
    if(schema.widget === 'textarea'){
        return <ThemeProvider theme={defaultTheme}><TextInput size="medium" variant='outlined' style={styles.largeRegularTextField} placeholder={schema.examples?.[0]} validate={validate(schema)} label={util.title(schema)} disabled={disabled} source={schema.name!} multiline={schema.widget === 'textarea'} rows={schema.widget === 'textarea' ? 9 : 1} inputProps={{ style: util.style(schema.style) }} /></ThemeProvider>
    }
    if (schema.widget === 'select')
        return <SingleSelect schema={schema}></SingleSelect>
    if (schema.enum)
        return <SingleSelect schema={schema}></SingleSelect>
    const fk = (schema: Schema, key?: number) => {
        const x = util.parseColumnID(schema.ref!)
        return <ReferenceInput
            key={key}
            placeholder={schema.examples?.[0]}
            disabled={disabled}
            source={schema.name!}
            reference={util.toResource(x)}
            queryOptions={{ meta: { keys: true } }}
        >
            <AutocompleteInput sx={util.style(schema.style)} validate={validate(schema)} label={util.title(schema)} />
        </ReferenceInput>
    }
    if (schema.displayWith === 'fk')
        return fk(schema)
    if (schema.widgetType === 'queryEdit')
        return <>
            {def}
            <QueryEdit></QueryEdit>
        </>
    if (schema.widgetType === 'mapping')
        return <Mapping></Mapping>
    if (schema.widgetType === 'expression')
        return <Expression schema={schema}></Expression>
    if (schema.widgetType === 'stream-expressions')
        return <StreamExpression></StreamExpression>
    if (schema.additionalProperties)
        return <AdditionalProperties schema={schema}></AdditionalProperties>
    if (schema.widget === 'key value')
        return <AdditionalProperties schema={{ name: schema.name, title: util.title(schema), description: schema.description, type: 'object', additionalProperties: { type: 'string' } }}></AdditionalProperties>
    if (schema.layout === 'select' && schema.type === 'array')
        return <MultiSelect schema={schema}></MultiSelect>
    if (schema.widget === 'multi select')
        return <MultiSelect schema={schema}></MultiSelect>
    if (schema.type === 'number' || schema.type === 'integer' || schema.widget === 'number')
        return <NumberInput validate={validate(schema)} label={util.title(schema)} disabled={disabled} source={schema.name!} inputProps={{ style: util.style(schema.style) }} />
    if (schema.type === 'boolean' || schema.widget === 'boolean')
        return <BooleanInput label={util.title(schema)} source={schema.name!} inputProps={{ style: util.style(schema.style) }} />
    if (schema.widget === 'file' || schema.widget === 'binary file' || schema.widget === 'file with metadata' || schema.widget === 'binary file with metadata')
        return <Upload schema={schema} validate={validate(schema)} />
    if (schema.type === 'object')
        if (schema.properties && Object.keys(schema.properties).length > 0)
            return <>{
                Object.entries(schema.properties).map(([k, v]) => <SwitchInner key={k} schema={{ ...v, name: schema.name + '.' + k }} value={value?.[k]} />)
            }</>
        else
            return <></>
    if (schema.widget === 'password')
        return <PasswordInput validate={validate(schema)} label={util.title(schema)} disabled={disabled} source={schema.name!} inputProps={{ style: util.style(schema.style) }} />
    if (schema.widget === 'voice')
        return <Voice schema={schema}></Voice>
    if (schema.widget === 'auto complete' || schema.choices || schema.choicesUrl)
        return <AutoComp disabled={disabled} schema={schema}></AutoComp>
    if (schema.widget === 'date')
        return <DateInput validate={validate(schema)} label={util.title(schema)} disabled={disabled} source={schema.name!} inputProps={{ style: util.style(schema.style) }} />
    if (schema.widget === 'datetime')
        return <DateTimeInput validate={validate(schema)} label={util.title(schema)} disabled={disabled} source={schema.name!} inputProps={{ style: util.style(schema.style) }} />
    let i = 0
    if (schema.type === 'array' && schema.items?.type === 'object') {
        const fields = Object.entries(schema.items.properties!).map(([k, v]) => {
            if (v.displayWith === 'fk')
                return fk({ ...v, name: k }, i++)
            if (v.widget === 'datetime')
                return <DateTimeInput key={i++} source={k} readOnly={v.readOnly} label={v.title ? v.title : k} />
            if (v.widget === 'date')
                return <DateInput key={i++} source={k} readOnly={v.readOnly} label={v.title ? v.title : k} />
            if (v.type === 'boolean' || v.widget === 'boolean')
                return <BooleanInput key={i++} source={k} readOnly={v.readOnly} label={v.title ? v.title : k} />
            if (v.type === 'string' || v.widget === 'string')
                return <TextInput key={i++} source={k} readOnly={v.readOnly} label={v.title ? v.title : k} />
            return <NumberInput key={i++} source={k} readOnly={v.readOnly} label={v.title ? v.title : k} />
        })
        return <ArrayInput validate={validate(schema)} label={util.title(schema)} disabled={disabled} source={schema.name!}>
            <SimpleFormIterator inline disableClear disableReordering>
                {
                    fields.length === 1 ? fields[0] : fields
                }
            </SimpleFormIterator>
        </ArrayInput>
    }
    if (schema.type === 'array')
        return <ArrayInput validate={validate(schema)} label={util.title(schema)} disabled={disabled} source={schema.name!}>
            <SimpleFormIterator inline disableClear disableReordering>
                {
                    schema.items?.displayWith === 'fk' ?
                        fk(schema.items) :
                        (schema.items?.type === 'string' || schema.items?.widget === 'string' ? <TextInput source="" /> : <NumberInput source="" />)
                }
            </SimpleFormIterator>
        </ArrayInput>
    if (schema.ID === 'dj/config/dj-config/string')
        if (window.location.href.endsWith('/config/dj-config/on-login'))
            return <ConfigExpression schema={schema}></ConfigExpression>

    return def
}

/**
 * autocomplete version of single select
 */
const AutoComp = ({ schema, disabled }: { schema: Schema, disabled?: boolean }) => {
    // const value = useWatch()
    const { data, isLoading, error } = useChoices(schema)
    if (isLoading) return <Loading />
    if (error) return <PrintError error={error}></PrintError>

    // include current value if not already there
    /*
    if (value[schema.name!]) {
        let found = false
        for (const d of data!)
            if (d.id === value[schema.name!])
                found = true
        if (!found)
            data!.push({ id: value[schema.name!], name: value[schema.name!] })
    }
    */

    return <AutocompleteFreeSolo onCreate={s => {
        data?.push({ id: s, name: s! })
        return { id: s, name: s }
    }} validate={validate(schema)} label={util.title(schema) ? util.title(schema) : schema.name} disabled={disabled} source={schema.name!} choices={data!} style={schema.style} />
}

/**
 * component to display FK
 */
const FK = ({ schema }: { schema: Schema }) => {

    const value = useWatch()
    const prop = util.parseColumnID(schema.ref!)
    const { data } = useGetOne('config/Table', { id: 'dj/' + prop.database + '/' + util.encodeTableOrColumnName(prop.table) });

    if (data?.['dj-label'] && util.isValue(value[schema.name!]))
        return <FKLabel schema={schema} djLabel={data['dj-label']} value={value[schema.name!]}></FKLabel>
    else
        return <FKValue schema={schema} labelValue={value[schema.name!]}></FKValue>
}

const FKLabel = ({ schema, djLabel, value }: { schema: Schema, djLabel: string, value: any }) => {
    const prop = util.parseColumnID(schema.ref!)
    const { data } = useGetOne(util.toResource(prop), { id: value });

    if (data)
        // in case ${title} evaluates to "", use PK
        return <FKValue schema={schema} labelValue={util.label(djLabel, data) === '' ? value : util.label(djLabel, data)}></FKValue>
    else
        return <FKValue schema={schema} labelValue={value}></FKValue>
}

const FKValue = ({ schema, labelValue }: { schema: Schema, labelValue: string }) => {
    // set filter to current value
    const value = useWatch()

    // filter and choices state
    const [filter, setFilter] = useState(value[schema.name!])
    const [choices, setChoices] = useState([{ id: value[schema.name!], name: labelValue }])

    const debounce = useDebounce(filter, 1000)
    const dataProvider = useDataProvider()

    useEffect(() => {
        const tbl = util.parseColumnID(schema.ref!)
        dataProvider.keys(tbl.database, tbl.table, debounce ? debounce : '').then(
            (r: any) => {
                /*
                if (Array.isArray(r) && r.length === 0 && util.isValue(value[schema.name!]))
                    setChoices([{ id: value[schema.name!], name: value[schema.name!] }])
                else
                 */
                setChoices(r.map((c: Choice) => { return { id: c.value, name: c.name } }))
            })
    }, [debounce, dataProvider, schema.name, schema.ref, value])

    return <AutocompleteFreeSolo
        onCreate={s => {
            choices?.push({ id: s, name: s! })
            setChoices([...choices])
            return { id: s, name: s }
        }}
        validate={validate(schema)}
        label={util.title(schema) ? util.title(schema) : schema.name}
        source={schema.name!}
        onInput={(e: any) => setFilter(e.target.value)}
        style={schema.style}
        choices={choices}
    />
}
const styles = {
    largeTextField: {
        width: '1102px',
    },
    regularTextField:{
        width: '520px',
        height: '100px'
    },
    largeRegularTextField:{
        width: '1102px',
    }
}
const Voice = ({ schema }: { schema: Schema }) => {
    const input = useController({ name: schema.name!, defaultValue: '' });
    const value = input.field.value
    const onChange = input.field.onChange

    return <ThemeProvider theme={defaultTheme}>
        <FormControl variant="standard">
            <TextField
                variant="outlined"
                label={util.title(schema)}
                style={styles.largeTextField}
                multiline={true}
                value={value}
                onChange={onChange}
                rows='12'
                InputProps={{
                    endAdornment: <InputAdornment position="start">
                        <IconButton edge='end' onClick={() => {
                            const recognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
                            const r = new recognition()
                            r.lang = (schema as any).language
                            r.start()
                            r.onresult = (x: any) => {
                                onChange(value + ' ' + x.results[0][0].transcript)
                            }
                        }}>
                            <Icon sx={{ marginBottom: '30px' }}>mic</Icon>
                        </IconButton>
                    </InputAdornment>,
                }}
            />
        </FormControl>
        </ThemeProvider>
}

const AdditionalProperties = ({ schema }: { schema: Schema }) => {

    const input = useController({ name: schema.name!, defaultValue: {} });
    const value = input.field.value
    const onChange = input.field.onChange

    let i = 0
    return <>
        <InputLabel>{schema.name}</InputLabel>
        {(value ? Object.entries(value) : []).map(([k, v]) => <Stack direction={'row'} key={i++}>
            <FormControl variant="standard">
                <TextField
                    value={k}
                    onChange={(x) => util.setKey(onChange, value, k, x.target.value)}
                />
            </FormControl >
            &nbsp;
            &nbsp;
            {schema.additionalProperties!.properties ?
                <Stack direction={'column'}>{Object.entries(schema.additionalProperties!.properties).map(([n, p]) => {
                    if (p.enum)
                        return <FormControl key={i++} variant="filled">
                            <InputLabel id="demo-simple-select-label">{n}</InputLabel>
                            <Select
                                labelId="demo-simple-select-label"
                                value={(v as any)?.[n] ? (v as any)?.[n] : ''}
                                onChange={(x) => util.setNested(onChange, value, k, n, x.target.value as any)}>
                                {p.enum.map(e => <MenuItem key={i++} value={e}>{e}</MenuItem>)}
                            </Select>
                        </FormControl>

                    return <FormControl key={i++} variant="standard">
                        <TextField
                            label={n}
                            value={(v as any)?.[n] ? (v as any)?.[n] : ''}
                            onChange={(x) => util.setNested(onChange, value, k, n, x.target.value as any)}>
                        </TextField>
                    </FormControl>
                })
                }
                </Stack>
                :
                <FormControl variant="standard">
                    <TextField
                        value={v}
                        onChange={(x) => util.set(onChange, value, k, x.target.value as any)}>
                    </TextField>
                </FormControl>
            }
            <IconButton onClick={() => util.del(onChange, value, k)}><Icon>remove_circle_outline</Icon></IconButton>
        </Stack >
        )}
        <IconButton
            onClick={() => util.add(onChange, value)}
            sx={{ width: '32px' }}
        ><Icon>add_circle_outline</Icon></IconButton>
    </>
}

/*
const AdditionalProperties = ({ schema }: { schema: Schema }) => {
    const x = useEditContext()

    if (x?.record?.[schema.name!])
        x.record[schema.name!] = util.map2array(x.record[schema.name!])

    // if additionalProps is simple type, we use a "value" column
    const props = schema.additionalProperties!.properties ?
        schema.additionalProperties!.properties : { value: schema.additionalProperties! }

    let i = 0
    return <ArrayInput
        validate={validate(schema)}
        label={util.title(schema)}
        source={schema.name!}
    >
        <SimpleFormIterator inline>
            <TextInput key={i++} source={'key'}></TextInput>
            {Object.entries(props).map(([n, p]) => {
                if (p.enum)
                    return <SelectInput key={i++} source={n} choices={p.enum.map(e => { return { id: e, name: e } })} />
                return <TextInput key={i++} source={n}></TextInput>
            })}
        </SimpleFormIterator>
    </ArrayInput>
}
*/

/**
 * multi select from choices
 */
const MultiSelect = ({ schema }: { schema: Schema }) => {
    const { data, isLoading, error } = useChoices(schema);
    if (isLoading) return <Loading />
    if (error) return <PrintError error={error}></PrintError>

    return <SelectArrayInput validate={validate(schema)} label={util.title(schema)} source={schema.name!} choices={data} style={schema.style} />
}

/**
 * multi select from choices
 */
const SingleSelect = ({ schema }: { schema: Schema }) => {
    const { data, isLoading, error } = useChoices(schema);
    if (isLoading) return <Loading />
    if (error) return <PrintError error={error}></PrintError>

    return <SelectInput validate={validate(schema)} label={util.title(schema)} source={schema.name!} choices={data} style={schema.style} />
}

const formats: any = {
    /* eslint-disable */
    email: ['Must be an email', /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/],
    ipv4: ['Must be an IP address', /^(?!0)(?!.*\.$)((1?\d?\d|25[0-5]|2[0-4]\d)(\.|$)){4}$/],
    url: ['Must be a url', /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/],
    uri: ['Must be an uri', /^\w+:(\/?\/?)[^\s]+$/],
    'date-time': ['Must be a date-time', /^([0-9]+)-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])[Tt]([01][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9]|60)(\.[0-9]+)?(([Zz])|([\+|\-]([01][0-9]|2[0-3]):[0-5][0-9]))$/]
    /* eslint-enable */
}

const validate = (schema: Schema) => {
    const validate: any[] = []
    if (schema.required)
        validate.push(required())
    if (schema.format)
        if (formats[schema.format])
            validate.push(regex(formats[schema.format][1], formats[schema.format][0]))
        else
            validate.push(regex(new RegExp(schema.format), 'Must match a specific format (regexp): ' + schema.format))
    return validate
}