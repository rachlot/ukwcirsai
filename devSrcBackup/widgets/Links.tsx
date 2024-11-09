import { useRecordContext } from "ra-core";
import { Labeled, Link, Loading, Pagination, ReferenceArrayField, ReferenceField, ReferenceManyField, SimpleShowLayout, SingleFieldList } from "ra-ui-materialui";
import { util } from "../api/Util";
import { useIncoming } from "../hooks/useIncomping";
import { useLoc } from "../hooks/useLoc";
import { useSchema } from "../hooks/useSchema";
import { Origin } from "../model/origin";
import { Prop } from "../model/prop";
import { Schema } from "../model/schema";
import { title } from "../api/Const";
import { Icon } from '@mui/material'
import { Value } from "../components/Value";
import { PrintError } from "../components/PrintError";
import { Paper } from '@mui/material'

/**
 * displays links to table, as well as all outgoing and incoming links
 */
export const Links = () => {

    const loc = useLoc()
    const record = useRecordContext()
    const incoming = useIncoming(loc.database!, loc.table!, loc.id)
    const { data, isLoading, error } = useSchema();

    if (isLoading) return <Loading />
    if (error) return <PrintError error={error}></PrintError>
    if (incoming.isLoading) return <Loading />
    if (incoming.error) return <PrintError error={error}></PrintError>

    const schema = data as Schema

    // the incoming links result is parsed and prepared for display using ReferenceMany
    const inc: any[] = []
    for (const i of incoming.data) {
        const fk = util.parseColumnID((i as Origin).fk)
        inc.push({
            // the related table
            table: util.toResource((i as Origin).id),
            // column to display (this is the pk of the related table)
            source: i.id.pkCols,
            // foreign key name
            target: fk.property,
            // display label
            label: util.localName(fk.table) + '.' + util.localName(fk.property)
        })
    }

    // outgoing links
    const outgoing: Prop[] = []
    for (const p of Object.values(schema.properties!))
        if (p.ref && util.isValue(record[p.name!])) {
            const prop = util.parseColumnID(p.ref)
            prop.property = p.name!
            outgoing.push(prop)
        }
    // outgoing links array
    const outgoingArray: Prop[] = []
    for (const p of Object.values(schema.properties!))
        if (p.type === 'array' && p.items?.ref && Array.isArray(record[p.name!])) {
            const prop = util.parseColumnID(p.items.ref)
            prop.property = p.name!
            outgoingArray.push(prop)
        }

    // there can be edge cases, where user performs a table schema edit, RA ist still saving - in this case schema.ID is undefined
    const table = util.parseTableID(schema.ID ? schema.ID : schema.parent + '/' + schema.name)

    let out = 0
    return <Paper sx={{ marginBottom: '10px' }}><SimpleShowLayout>
        <Labeled label="Table">
            <Link to={'/' + table.database + '/' + encodeURIComponent(table.table)}>{schema.name}</Link>
        </Labeled>
        {outgoing.map(p => <ReferenceField key={out++} source={p.property} reference={util.toResource(p)} label={util.localName(p.property)}></ReferenceField>)}
        {outgoingArray.map(p => <ReferenceArrayField key={out++} source={p.property} reference={util.toResource(p)} label={util.localName(p.property)}></ReferenceArrayField>)}
        {inc.map(p => <ReferenceManyField
            key={out++}
            reference={p.table}
            target={p.target}
            perPage={10}
            pagination={<Pagination />}
            label={p.label}
        >
            <SingleFieldList linkType={false}>
                {p.source.length === 1
                    ? <><ReferenceField reference={p.table} source={p.source[0]} />&nbsp;&nbsp;</>
                    : <><CompLink p={p} />
                        &nbsp;&nbsp;
                    </>}
            </SingleFieldList>
        </ReferenceManyField>
        )}
    </SimpleShowLayout></Paper>
}

/**
 * link to composite key record
 */
const CompLink = ({ p }: { p: any }) => {
    const record = useRecordContext()
    const schema = useSchema()

    const link = p.source.map((c: any) => record[c]).join('_')

    if (schema.data?.['dj-label'])
        if (p.source.length === 1)
            return <Value data={record[p.source[0]]} schema={schema.data.properties[p.source[0]]}></Value>
    const [database, table] = util.parseResource(p.table)
    return <Link to={'/' + encodeURIComponent(database) + '/' + encodeURIComponent(table) + '/' + encodeURIComponent(link)}>{link}</Link>
}

export default Links

export const config = {
    id: 'links',
    title: 'Links',
    description: 'Outgoing and incoming links to and from this record',
    version: 1,
    icon: <Icon>links</Icon>,
    controls: {
        type: 'autoform',
        schema: {
            properties: {
                title: title
            }
        }
    }
}