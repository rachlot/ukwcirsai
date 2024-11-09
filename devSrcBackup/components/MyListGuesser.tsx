import { AutocompleteInput, DatagridConfigurable, List, TextInput, BooleanInput, ReferenceInput } from "ra-ui-materialui"
import { Schema } from "../model/schema"
import { Field } from "./Field"
import { Actions } from "./Actions"
import { ListContextListener } from "./ListContextListener"
import { useResourceContext } from "react-admin"
import { profile } from "../api/Profile"
import { util } from "../api/Util"

/**
 * displays a table row based on schema info
 */
export const MyListGuesser = ({ schema, resource, selectable, bulkActionButtons, allTable, perPage }: { schema: Schema, resource?: string, selectable: boolean, bulkActionButtons?: any, allTable?: boolean, perPage?: number }) => {
    const rc = useResourceContext()
    const key = 'RaStore.preferences.' + (rc ? rc : resource) + '.listParams'
    const filterValues = profile.local(key)?.filterValues
    const listParams = profile.local(key)
    let i = 0
    const pks = allTable ? Object.values(schema.properties!).filter(p => (p.pkpos !== undefined) && (p.pkpos !== null)).map(p => p.name!) : []
    return <List disableSyncWithLocation resource={resource} actions={<Actions />} filters={
        Object.entries(schema.properties!)
            .filter(([k, v]) => v.type === 'string' || v.type === 'boolean' || v.type === 'number')
            // react hook form interprets input source with . as nested field access
            // https://github.com/dashjoin/platform/issues/392
            .filter(([k, v]) => !k.includes('.'))
            .map(([k, v]) => {
                let key
                if (v.pkpos === 0)
                    key = v.ID
                if (v.ref)
                    key = v.ref
                if (key) {
                    const x = util.parseColumnID(key)
                    return <ReferenceInput
                        label={util.title(v)}
                        source={k}
                        reference={util.toResource(x)}
                        queryOptions={{ meta: { keys: true } }}
                    >
                        <AutocompleteInput label={util.title(v)} />
                    </ReferenceInput>
                }
                if (v.type === 'boolean')
                    return <BooleanInput key={i++} source={k} label={v.title ? v.title : k} />
                const choices = util.getSamples((rc ? rc : resource)!, k, filterValues)
                return <AutocompleteInput source={k} label={v.title ? v.title : k}
                    choices={choices}
                    createItemLabel="%{item}"
                    createLabel=""
                    onCreate={e => {
                        const choice = { id: e, name: e }
                        choices.push(choice)
                        return choice
                    }}
                />
                // return <TextInput key={i++} source={k} label={k} />
            })
    }
        perPage={listParams?.perPage ? listParams?.perPage : perPage}
        sort={listParams?.sort ? listParams?.sort : undefined}
        filterDefaultValues={listParams?.filterValues ? listParams?.filterValues : undefined}
    >
        <ListContextListener resource={resource} />
        <DatagridConfigurable bulkActionButtons={bulkActionButtons ? bulkActionButtons : (selectable ? undefined : false)}
            sx={{
                "& .RaDatagrid-rowCell": {
                    whiteSpace: "nowrap",
                    maxWidth: '300px',
                    overflowX: 'hidden'
                },
                "& .RaDatagrid-headerCell": {
                    whiteSpace: "nowrap",
                },
            }}
        >
            {Object.entries(schema.properties!).map(([k, v]) => <Field key={i++} label={v.title ? v.title : k} source={k} schema={v} pks={pks} />)}
        </DatagridConfigurable>
    </List >
}
