import { Icon, Typography } from "@mui/material"
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import { DataProviderContext } from "ra-core"
import React from "react"
import { constDataProvider } from "../api/ConstDataProvider"
import { util } from "../api/Util"
import { Row } from "../model/row"
import { Schema } from "../model/schema"
import { LinkValue } from "./LinkValue"
import { MyListGuesser } from "./MyListGuesser"
import { helper } from "./helper"

/**
 * generic display of an data
 */
export const Value = ({ data, schema, resource, icons, subvalue, perPage }: {
    /**
     * data to print - can be table, list, map, or a single value
     */
    data: any,

    /**
     * if we are fed from a query, this is the query metadata
     */
    schema?: Schema,

    /**
     * only requried for map display, usually the expression used to compute the map
     */
    resource?: string,

    /**
     * optional map icons (map with the same keys and material icons as values)
     */
    icons?: any

    /**
     * value is called recursively
     */
    subvalue?: boolean

    /**
     * passed from table widget
     */
    perPage?: number
}) => {

    /**
     * array of object => table
     */
    if (Array.isArray(data) && !subvalue)
        if (data.length > 0)
            if (typeof data[0] === 'object') {

                if (!schema)
                    schema = util.inferSchemaFromData(data)

                // make sure it's not a list of links / images 7 etc.
                const tmp = helper(data[0])
                if (!tmp)

                    // append the data's length in order to make the table update
                    return <DataProviderContext.Provider value={constDataProvider.create(data)}>
                        <MyListGuesser schema={schema} resource={resource ? resource + '/' + data.length : resource} selectable={false} perPage={perPage}></MyListGuesser>
                    </DataProviderContext.Provider>
            }

    /**
     * array: use SingleFieldList 
     */
    if (Array.isArray(data)) {
        let i = 0
        return <>{data.map((item) => <React.Fragment key={i++}><Value subvalue={true} data={item}></Value>&nbsp;</React.Fragment>)}</>
    }

    /**
     * object is a key value SimpleList
     */
    if (data !== null && typeof data === 'object') {

        if (Object.keys(data).length === 0)
            return <></>

        const tmp = helper(data)
        if (tmp)
            return tmp

        const kv: Row[] = []
        for (const [k, v] of Object.entries(data))
            kv.push({ key: k, value: v, icon: icons?.[k] })
        let counter = 0
        return <List>
            {kv.map(i => {
                const kid = <Value subvalue={true} data={i.value} schema={schema?.properties?.[i.key]}></Value>
                const simple = typeof i.value === 'string' || typeof i.value === 'number' || !i.value || i.value === true || i.value === false ||
                    (typeof i === 'object' && helper(i.value)) ||
                    (Array.isArray(i.value) && i.value.length > 0 && (typeof i.value[0] === 'string' || typeof i.value[0] === 'number' || typeof i.value[0] === 'boolean'))
                return <ListItem key={counter++}>
                    <ListItemIcon><Icon>{i.icon ? i.icon : 'arrow_forward'}</Icon></ListItemIcon>
                    <ListItemText primary={i.key} secondary={simple ? kid : undefined}></ListItemText>
                    {!simple ? kid : <></>}
                </ListItem>
            })}
        </List>
    }

    if (data && schema)
        if (util.isValue(schema.pkpos) || schema.ref)
            return <LinkValue data={data} prop={util.parseColumnID(schema.ref ? schema.ref : schema.ID!)}></LinkValue>

    /**
     * render using ra TextField (function field simply allows using a function instead of a record reference)
     */
    return <Typography component="span">{data}</Typography>
}