import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { IconButton, Typography } from "@mui/material";
import { useGetOne, useRecordContext } from 'ra-core';
import { Loading } from "ra-ui-materialui";
import { useState } from "react";
import { Link } from "react-router-dom";
import { util } from '../api/Util';
import { Value } from "../components/Value";
import { useDjQuery } from "../hooks/useDjQuery";
import { Schema } from "../model/schema";
import { Widget } from "../model/widget";
import { title, database, expression } from '../api/Const';
import { query } from '../api/Const';
import { Icon } from '@mui/material'
import { useLoc } from '../hooks/useLoc';
import { PrintError } from "../components/PrintError";
import { useExpression } from '../hooks/useExpression';

/**
 * root node - check for dj-nav special case (query does not exist in catalog)
 */
export const TreeRoot = ({ widget }: { widget: Widget }) => {
    if (widget.query === 'dj-navigation')
        return <NonRecTree isRoot={true} widget={widget}></NonRecTree>
    else if (widget.query)
        return <TreeRoot2 widget={widget}></TreeRoot2>
    else if (widget.expression)
        return <TreeExprRoot widget={widget}></TreeExprRoot>
    else
        return <p>Tree - please provide a query or an expression</p>
}

/**
 * get query, and check for parameters
 * then branch into rec and non rec tree versions
 */
const TreeRoot2 = ({ widget }: { widget: Widget }) => {
    const record = useRecordContext()
    const { data, isLoading, error } = useGetOne('config/dj-query-catalog', { id: widget.query })

    if (isLoading) return <Loading />
    if (error) return <PrintError error={error}></PrintError>

    if (data.arguments)
        return <Tree isRoot={true} widget={widget} parName={Object.keys(data.arguments)[0]} par={record?.id} ></Tree >
    else
        return <NonRecTree isRoot={true} widget={widget}></NonRecTree>
}

const TreeExprRoot = ({ widget }: { widget: Widget }) => {
    const { data, isLoading, error } = useExpression(widget.cached!, widget.expression)

    if (isLoading) return <Loading />
    if (error) return <PrintError error={error}></PrintError>

    return <TreeExpr isRoot={true} ds={data} ></TreeExpr>
}

/**
 * recursive query tree
 */
const TreeExpr = ({ ds, isRoot }: { ds: Node[], isRoot?: boolean }) => {

    if (!ds)
        ds = []
    if (!Array.isArray(ds))
        ds = [ds]

    for (let i = 0; i < ds.length; i++) {
        if (ds[i].data === undefined)
            ds[i] = { data: ds[i] } as any
        ds[i].index = i
    }
    let [data, setData] = useState<Node[]>(ds)

    /**
     * node was opened / closed
     */
    const toggle = (index: number) => {
        const copy = [...data!]
        copy[index].open = !copy[index].open
        setData(copy)
    }

    // the root node uses margin-left -40 to offset the extra ul
    // draw the tree level using ul tag, open / close button, value and nested sub-trees
    let i = 0
    return <ul style={{ listStyleType: 'none', marginLeft: !isRoot ? '0px' : '-40px' }}>
        {
            data!.map(item => <li key={i++}>
                <IconButton sx={{ visibility: Array.isArray(item.children) ? undefined : 'hidden' }} onClick={() => toggle(item.index)}>
                    {item.open ? < ExpandMoreIcon /> : <ChevronRightIcon />}
                </IconButton>
                <Value data={item.data} schema={item.schema}></Value>
                {item.open ? <TreeExpr ds={item.children ? item.children : []}></TreeExpr> : <></>}
            </li>)
        }
    </ul >
}

/**
 * non-recursive query tree
 */
const NonRecTree = ({ widget, isRoot }: { widget: Widget, isRoot?: boolean }) => {
    const { data, isLoading, error } = useDjQuery(widget)
    const loc = useLoc()
    if (isLoading) return <Loading />
    if (error) return <PrintError error={error}></PrintError>

    const nodes: Node[] = table2nodes(data?.data, data?.schema)

    // pre-open folders based on location
    for (const node of nodes)
        if (node.data.children) {
            for (const kid of node.data.children) {
                if (kid.href?.[0] === '/page' && kid.href?.[1] === loc.page)
                    node.open = true
                if ((kid.href?.[0] === '/resource' || kid.href?.[0] === '/table') && kid.href?.[1] === loc.database && kid.href?.[2] === loc.table)
                    node.open = true
            }
        }

    return <NonRecTree2 isRoot={isRoot} nodes={nodes}></NonRecTree2>
}

/**
 * non-recursive query tree
 */
const NonRecTree2 = ({ nodes, isRoot }: { nodes: Node[], isRoot?: boolean }) => {

    let [open, setOpen] = useState<boolean[]>(nodes.map(node => node.open))
    const loc = useLoc()

    /**
     * node was opened / closed
     */
    const toggle = (index: number) => {
        const copy = [...open]
        copy[index] = !copy[index]
        setOpen(copy)
    }

    const highlight = (node: Node): boolean => {
        if (node.data.href?.[0] === '/resource' && node.data.href?.[1] === loc.database && node.data.href?.[2] === loc.table && node.data.href?.[3] === loc.id)
            return true
        if (node.data.href?.[0] === '/page' && node.data.href?.[1] === loc.page)
            return true
        if (node.data.href?.[0] === '/table' && node.data.href?.[1] === loc.database && node.data.href?.[2] === loc.table)
            return true
        return false
    }

    // the root node uses negative margin-left to offset the extra ul
    // draw the tree level using ul tag, open / close button, value and nested sub-trees
    let i = 0
    return <ul style={{ listStyleType: 'none', paddingLeft: '18px', marginLeft: !isRoot ? '0px' : '-18px' }}>
        {
            nodes.map(item => <li key={i++}>
                {item.data?.children ? <IconButton onClick={() => toggle(item.index)} sx={item.data.children.length === 0 ? { visibility: 'hidden', padding: '0px' } : { padding: '0px' }}>
                    {open[nodes.indexOf(item)] ? < ExpandMoreIcon /> : <ChevronRightIcon />}
                </IconButton> : <></>}
                {
                    // use Value component to display kids - name / display / href are "legacy" to support the nav tree
                    item.data.display ?
                        <Typography sx={{ fontSize: '14px' }} component="span">{item.data.display}</Typography> :
                        item.data.href ?
                            <Link style={{ color: 'inherit', textDecoration: 'none' }} to={util.href(item.data.href.map(((x: any) => x.startsWith('/') ? x : encodeURIComponent(x))).join('/'))}><Typography sx={highlight(item) ? { fontWeight: 'bold', fontSize: '14px' } : { fontSize: '14px' }} component="span">{util.localName(item.data.name)}</Typography></Link> :
                            <Value data={item.data} schema={item.schema}></Value>
                }
                {open[nodes.indexOf(item)] ? <NonRecTree2 nodes={table2nodes(item.data.children)}></NonRecTree2> : <></>}
            </li>)
        }
    </ul >
}

/**
 * recursive query tree
 */
const Tree = ({ parName, par, widget, isRoot }: { parName: string, par: any, widget: Widget, isRoot?: boolean }) => {

    const { data: ds, isLoading, error } = useDjQuery(widget, { [parName]: par })
    let [data, setData] = useState<Node[]>()
    const [param, setParam] = useState<any>()

    if (isLoading) return <Loading />
    if (error) return <PrintError error={error}></PrintError>

    if (!data || par !== param) {
        const d = table2nodes(ds?.data, ds?.schema)
        setData(d)
        data = d
        setParam(par)
    }

    /**
     * node was opened / closed
     */
    const toggle = (index: number) => {
        const copy = [...data!]
        copy[index].open = !copy[index].open
        setData(copy)
    }

    // the root node uses margin-left -40 to offset the extra ul
    // draw the tree level using ul tag, open / close button, value and nested sub-trees
    let i = 0
    return <ul style={{ listStyleType: 'none', marginLeft: !isRoot ? '0px' : '-40px' }}>
        {
            data!.map(item => <li key={i++}>
                <IconButton onClick={() => toggle(item.index)}>
                    {item.open ? < ExpandMoreIcon /> : <ChevronRightIcon />}
                </IconButton>
                <Value data={item.data} schema={item.schema}></Value>
                {item.open ? <Tree widget={widget} par={item.data} parName={parName}></Tree> : <></>}
            </li>)
        }
    </ul >
}

/**
 * tree node element
 */
interface Node {
    // child number
    index: number,

    // data to display
    data: any,

    // data's schema
    schema: Schema,

    // opened or closed
    open: boolean

    children?: Node[]
}

/**
 * converts the query table to a Node[]
 */
const table2nodes = (data: any, schema?: Schema) => {
    let index = 0
    return data.map((i: any) => {
        return {
            index: index++,
            open: false,
            schema: schema ? Object.values(schema.properties!)[0] : undefined,
            data: schema ? i[Object.keys(schema.properties!)[0]] : i
        }
    })
}

export default TreeRoot

export const config = {
    id: 'tree',
    title: 'Tree',
    description: 'Tree based on a query',
    version: 1,
    icon: <Icon>account_tree</Icon>,
    controls: {
        type: 'autoform',
        schema: {
            properties: {
                title: title,
                database: database,
                query: query,
                expression: expression
            }
        }
    }
}