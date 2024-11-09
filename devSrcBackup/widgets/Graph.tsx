import { Box, Dialog, DialogActions, DialogContent, Icon, IconButton, Input, Tooltip } from "@mui/material";
import { _3d, style, title } from "../api/Const";
import { Widget } from "../model/widget";
import { Resource, isResource } from "../model/resource";
import { util } from "../api/Util";
import React, { useState } from "react";
import { api } from "../api/Api";
import Expression from "../uniforms/Expression";
import { Loading } from "ra-ui-materialui";
import { PrintError } from "../components/PrintError";
import { useExpression } from "../hooks/useExpression";
import { SizeMe } from 'react-sizeme'
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import { Value } from "../components/Value";
import { Schema } from "../model/schema";
import AllOutIcon from '@mui/icons-material/AllOut';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { SearchResult } from "../model/search-result";
import { DataProviderContext, useDataProvider, useListContext, useNotify } from "ra-core";
import { constDataProvider } from "../api/ConstDataProvider";
import { MyListGuesser } from "../components/MyListGuesser";
import { isPath } from "../model/path";
import dynamic from "next/dynamic";

// Lazy load ForceGraph2D and 3D, this will lazy load THREE.js (saves 3MB JS code when not used)
const ForceGraph2D: any = dynamic( () => import('react-force-graph').then((mod) => mod.ForceGraph2D) );
const ForceGraph3D: any = dynamic( () => import('react-force-graph').then((mod) => mod.ForceGraph3D) );

interface Node {
    id: string
    resource: Resource
    name: string
    value?: any
    schema?: Schema

    // for initial loading only (this == edges[...].source)
    edges?: Edge[]
}

interface Edge {
    source: Node
    target: Node
    name: string
}

// given an resource, creates are node
const resource2node = (resource: Resource): Node => {
    const name = resource.database + '/' + util.encodeTableOrColumnName(resource.table) + '/' + resource.pk
    return {
        id: JSON.stringify(resource),
        resource,
        name,
    }
}

/**
 * convert widget parameters to a set of resources
 */
export const Graph = ({ widget }: { widget: Widget }) => {
    let { data, isLoading, error } = useExpression(widget.cached!, widget.nodes)
    if (isLoading) return <Loading />
    if (error) return <PrintError error={error}></PrintError>

    return <GraphData widget={widget} data={data} />
}

export const GraphData = ({ widget, data }: { widget: Widget, data: any }) => {
    const notify = useNotify()
    if (!data)
        data = []
    if (!Array.isArray(data))
        data = [data]

    const nodeMap: { [key: string]: Node } = {}
    const getOrCreate = (d: any) => {
        const node = resource2node(d)
        if (nodeMap[node.id])
            return nodeMap[node.id]
        nodeMap[node.id] = node
        return node
    }
    for (const d of data) {
        if (isResource(d))
            getOrCreate(d)
        else if (d && isResource(d._dj_resource))
            getOrCreate(d._dj_resource)
        else if (isPath(d)) {
            let source = getOrCreate(d.start._dj_resource)
            for (const step of d.steps) {
                let target = getOrCreate(step.end._dj_resource)
                if (!step.edge._dj_outbound) {
                    const tmp = source
                    source = target
                    target = tmp
                }

                if (step.edge._dj_edge?.includes('/'))
                    step.edge._dj_edge = util.parseColumnID(step.edge._dj_edge).table + '.' + util.parseColumnID(step.edge._dj_edge).property

                if (!source.edges)
                    source.edges = [{ source, target, name: step.edge._dj_edge }]
                else {
                    let found = false
                    for (const edge of source.edges)
                        if (edge.name === step.edge._dj_edge)
                            if (target.id === edge.target.id) {
                                found = true
                                break
                            }
                    if (!found)
                        source.edges.push({ source, target, name: step.edge._dj_edge })
                }
                if (step.edge._dj_outbound)
                    source = target
            }
        }
        else
            notify('Input data must be a resource or path: ' + JSON.stringify(d).substring(0, 400))
    }
    let height = 600
    if (widget.style?.height)
        if (!Number.isNaN(Number.parseInt(widget.style?.height)))
            height = Number.parseInt(widget.style?.height)

    return <Draw nodes={Object.values(nodeMap)} height={height} _3d={widget._3d ? true : false}></Draw>
}

const Draw = ({ nodes, height, _3d }: { nodes: Node[], height: number, _3d: boolean }) => {

    const notify = useNotify()

    // object shown in the info panel
    const [info, setInfo] = useState<Node>()

    // element width after first render
    let [width, setWidth] = useState(-1)

    // blacklisted tables
    const [blacklist, setBlacklist] = useState<string[]>([])

    // search dialog open state
    const [open, setOpen] = useState(false)

    // search term
    const [search, setSearch] = useState('')

    // search results
    const [searchResult, setSearchResult] = useState<any[]>([])
    const [searchResource, setSearchResource] = useState('_dj_graph_search')

    // graph state
    const links: any[] = []
    for (const node of nodes)
        if (node.edges)
            for (const edge of node.edges)
                links.push({ source: edge.source.id, target: edge.target.id, name: edge.name })
    const [graph, setGraph] = useState({ nodes, links });

    // lookup node by id
    const getNode = (resource: Resource): Node | undefined => {
        const id = JSON.stringify(resource)
        for (const node of graph.nodes)
            if (node.id === id)
                return node
    }

    // lookup node and create / add if not there
    const getOrCreateNode = (resource: Resource): Node => {
        const node = getNode(resource)
        if (node)
            return node
        const add = resource2node(resource)
        graph.nodes.push(add)
        return add
    }

    // lookup edge by S,P,O
    const getEdge = (source: Node, target: Node, name: string): Edge | undefined => {
        for (const edge of graph.links)
            if (edge.name === name)
                if (edge.source === source)
                    if (edge.target === target)
                        return edge
    }

    // get edge or create / add it
    const getOrCreateEdge = (source: Node, target: Node, name: string): Edge => {
        const edge = getEdge(source, target, name)
        if (edge)
            return edge
        const add = { source, target, name }
        graph.links.push(add)
        return add
    }

    // get edge by matching source or target
    const getEdges = (node: Node): Edge[] => {
        return graph.links.filter(edge => edge.source === node || edge.target === node)
    }

    // remove the given node
    const remove = (source: Node) => {
        const removeEdges = getEdges(source)
        graph.links = graph.links.filter(edge => (edge.source !== source) && (edge.target !== source))
        for (const remove of removeEdges) {
            for (const node of [remove.source, remove.target])
                if (getEdges(node).length === 0) {
                    const idx = graph.nodes.indexOf(node)
                    if (idx >= 0)
                        graph.nodes.splice(idx, 1)
                }
        }
        setGraph({ ...graph })
    }

    const load = async (source: Node) => {
        const res = source.resource
        source.value = await api.readComp(res.database, res.table, res.pk)
        const schema = await api.schema(res.database, res.table)
        source.schema = schema
        if (schema['dj-label'])
            source.name = util.label(schema['dj-label'], source.value)
    }

    // expand the given node
    const expand = async (source: Node) => {
        try {
            await load(source)
        }
        catch (err) {
            return
        }
        const schema = source.schema!
        const res = source.resource

        // outgoing links
        let fks = Object.values(schema.properties!).filter(p => util.isValue(p.ref))
        for (const fk of fks) {
            const prop = util.parseColumnID(fk.ref!)
            if (util.isValue(source.value[fk.name!]))
                if (!blacklist.includes(prop.table)) {
                    const target = getOrCreateNode({
                        database: prop.database,
                        table: prop.table,
                        pk: [source.value[fk.name!]]
                    })
                    getOrCreateEdge(source, target, fk.name!)
                }
        }
        fks = Object.values(schema.properties!).filter(p => util.isValue(p.items?.ref))
        for (const fk of fks) {
            const prop = util.parseColumnID(fk.items!.ref!)
            if (Array.isArray(source.value[fk.name!]))
                if (!blacklist.includes(prop.table))
                    for (const x of source.value[fk.name!]) {
                        const target = getOrCreateNode({
                            database: prop.database,
                            table: prop.table,
                            pk: [x]
                        })
                        getOrCreateEdge(source, target, fk.name!)
                    }
        }

        // incoming
        const incs = await api.incomingComp(res.database, res.table, res.pk)
        for (const inc of incs)
            if (!blacklist.includes(inc.id.table)) {
                const target = getOrCreateNode(inc.id)
                getOrCreateEdge(target, source, util.parseColumnID(inc.fk).table + '.' + util.parseColumnID(inc.fk).property)
            }
        setGraph({ ...graph })
    }

    // search for adding nodes
    const doSearch = async () => {
        if (!search)
            return
        setSearchResult((await api.search(search)).map((row: SearchResult) => {
            return {
                url: row.id,
                database: row.id.database,
                table: row.id.table,
                column: row.column,
                match: row.match,
            }
        }))
        setSearchResource('_dj_graph_search' + search)
    }

    // is the graph too large?
    const limit = () => graph.links.length >= 2000

    const onNodeClick = async (source: Node, event: any) => {
        try {
            await load(source)
        }
        catch (err) {
            return
        }
        if (event.ctrlKey)
            setInfo(source)
        else {
            if (limit())
                notify('Limit of 2000 graph edges reached')
            else
                await expand(source)
        }
    }

    const tables: any = {}
    graph.nodes.forEach(node => tables[node.resource.table] = true)
    const tableColor = util.color(Object.keys(tables))

    return <SizeMe>{({ size }) => {
        if (width < 0 && size.width) {
            width = size.width
            setTimeout(() => setWidth(width))
        }

        let index = 0
        return <>
            <Dialog open={open} onClose={() => setOpen(false)} maxWidth={false}>
                <DialogContent>
                    <Input value={search} onKeyDown={e => { if (e.key === 'Enter') doSearch() }} onChange={e => setSearch(e.target.value)}></Input>
                    <IconButton onClick={doSearch}>
                        <Icon>search</Icon>
                    </IconButton>
                    {searchResult.length > 0 ? <DataProviderContext.Provider value={constDataProvider.create(searchResult)}>
                        <MyListGuesser schema={util.inferSchemaFromData(searchResult)} resource={searchResource} selectable={false}
                            bulkActionButtons={<AddAction setSearch={setSearch} setSearchResult={setSearchResult} setGraph={setGraph} graph={graph} setOpen={setOpen} getOrCreateNode={getOrCreateNode} />}
                        ></MyListGuesser>
                    </DataProviderContext.Provider> : <></>}
                </DialogContent>
                <DialogActions>
                    <Button variant="contained" onClick={() => {
                        setOpen(false)
                    }}>Cancel</Button>
                </DialogActions>
            </Dialog>
            <Stack direction="row">
                {info ? <Stack direction="column">
                    <Stack direction="row-reverse">
                        <IconButton onClick={() => setInfo(undefined)}><Icon>close</Icon></IconButton>
                    </Stack>
                    <Box sx={{ width: 300, height, overflowX: 'hidden', overflowY: 'scroll' }}>
                        <Value data={info.value} schema={info.schema} resource="_dj_graph" />
                    </Box>
                </Stack> : <></>}
                {_3d ? <ForceGraph3D
                    width={(info ? width - 300 : width) - 16}
                    height={height}
                    graphData={graph}
                    linkDirectionalArrowLength={4}
                    linkDirectionalArrowRelPos={1}
                    linkCurvature={() => .1}
                    nodeColor={(node: Node) => tableColor[node.resource.table]}
                    onNodeRightClick={async (source: Node) => {
                        await remove(source)
                    }}
                    onNodeClick={onNodeClick}
                />
                    : <ForceGraph2D
                        width={(info ? width - 300 : width) - 16}
                        height={height}
                        graphData={graph}
                        linkDirectionalArrowLength={4}
                        linkDirectionalArrowRelPos={1}
                        linkCurvature={() => .1}
                        nodeColor={(node: Node) => tableColor[node.resource.table]}
                        onNodeRightClick={async (source: Node) => {
                            await remove(source)
                        }}
                        onNodeClick={onNodeClick}
                    />
                }
            </Stack>
            <Stack direction="row" flexWrap="wrap">
                <Tooltip title="Left click node to expand, right click to remove, CTRL click to see details">
                    <Button startIcon={<Icon>add</Icon>} variant="contained" onClick={() => {
                        setOpen(true)
                    }}></Button>
                </Tooltip>
                &nbsp;
                {Object.entries(tableColor).map(([table, color]) => <React.Fragment key={index++}>
                    <Button startIcon={<AllOutIcon />} variant="contained" sx={{ backgroundColor: color }} onClick={() => {
                        if (limit())
                            notify('Limit of 2000 graph edges reached')
                        else
                            graph.nodes.filter(node => node.resource.table === table).forEach((node) => {
                                if (!limit())
                                    expand(node)
                            })
                    }}>{table}</Button>
                    &nbsp;
                    <Button startIcon={<Icon>delete</Icon>} variant="contained" sx={{ backgroundColor: color }} onClick={() => {
                        if (!blacklist.includes(table)) {
                            blacklist.push(table)
                            setBlacklist(blacklist)
                        }
                        graph.nodes.filter(node => node.resource.table === table).map((node) => remove(node))
                    }}></Button >
                    &nbsp;
                </React.Fragment>)}
                &nbsp;
                {blacklist.length > 0 ? <Tooltip title={"Reset blacklisted tables: " + blacklist}>
                    <Button startIcon={<RestartAltIcon />} variant="contained" onClick={() => {
                        setBlacklist([])
                    }}>{blacklist.length}</Button>
                </Tooltip> : <></>}
            </Stack >
        </>
    }}</SizeMe>
}

/**
 * Metadata
 */
export const config = {
    id: 'graph',

    // capitalized version
    title: 'Graph',

    // description in widget chooser
    description: 'Shows relationships in graph form',
    version: 1,

    icon: <Icon>device_hub</Icon>,
    controls: {
        type: 'autoform',
        schema: {
            properties: {
                title: title,
                nodes: { title: 'Expression to generate nodes', uniforms: { component: Expression } },
                style: style,
                _3d: _3d
            },
        },
    }
}

const AddAction = ({ setSearch, setSearchResult, getOrCreateNode, setOpen, setGraph, graph }: { setSearch: Function, setSearchResult: Function, getOrCreateNode: Function, setOpen: Function, setGraph: Function, graph: any }) => {
    const { selectedIds } = useListContext();
    const constDataProvider = useDataProvider()
    return <Button onClick={async () => {
        for (const id of selectedIds)
            getOrCreateNode((await constDataProvider.getOne('', { id })).data.url)
        setGraph({ ...graph })
        setOpen(false)
        setSearch('')
        setSearchResult([])
    }}>Add</Button>
}
