import Dagre from '@dagrejs/dagre';
import { useCallback, useRef } from 'react';
import ReactFlow, {
    Background,
    Connection,
    Controls,
    EdgeChange, MarkerType,
    MiniMap,
    NodeChange,
    addEdge,
    useEdgesState,
    useNodesState,
    useReactFlow,
    ReactFlowProvider
} from 'reactflow';

import { useNavigate } from "react-router";
import { Icon } from '@mui/material';
import { Loading, useDataProvider, useNotify, useRefresh } from 'react-admin';
import 'reactflow/dist/style.css';
import { style, title } from '../api/Const';
import { useExpression } from '../hooks/useExpression';
import { useExpressionContext } from '../hooks/useExpressionContext';
import { Widget } from '../model/widget';
import { util } from '../api/Util';
import Expression from '../uniforms/Expression';
import { PrintError } from "../components/PrintError";
import { action } from '../api/Action';

/**
 * generic diagram component

    // org chart
    widget = {
        nodes: '$all("northwind", "EMPLOYEES").{"id": $string(EMPLOYEE_ID), "database": "northwind", "table": "EMPLOYEES", "position": {"x": X, "y": Y}, "data": {"label": LAST_NAME}}',
        edges: '$all("northwind", "EMPLOYEES")[REPORTS_TO != null].{"id": $string(EMPLOYEE_ID) & "-" & $string(REPORTS_TO), "source": $string(EMPLOYEE_ID), "target": $string(REPORTS_TO)}',
        addNode: '($id := $max($all("northwind", "EMPLOYEES").EMPLOYEE_ID)+1; $create("northwind", "EMPLOYEES", {"EMPLOYEE_ID": $id, "LAST_NAME": node.label, "FIRST_NAME": "todo", "X": node.position.x, "Y": node.position.y}) ; {"id": "" & $id, "position": node.position, "data": {"label": node.label}, "database": "northwind", "table": "EMPLOYEES"})',
        addEdge: '$update("northwind", "EMPLOYEES", edge.source, {"REPORTS_TO": edge.target})',
        removeEdge: '$update("northwind", "EMPLOYEES", edge.source, {"REPORTS_TO": null})',
    }

    // employee - project m:n
    widget = {
        nodes: '[$all("northwind", "EMP").{"id": ID, "database": "northwind", "table": "EMP", "position": {"x": X, "y": Y}, "data": {"label": "EMP: " & ID}}, $all("northwind", "PROJECT").{"id": ID, "database": "northwind", "table": "PROJECT", "position": {"x": X, "y": Y}, "data": {"label": "PRJ: " & ID}}]',
        edges: '$all("northwind", "WORKSON").{"id": EMP & "-" & PROJECT, "source": EMP, "target": PROJECT}',
        addNode: '($create("northwind", node.metaKey ? "PROJECT" : "EMP", {"ID": node.label, "X": node.position.x, "Y": node.position.y}); {"id": node.label, "position": node.position, "database": "northwind", "table": node.metaKey ? "PROJECT" : "EMP", "data": {"label": (node.metaKey ? "PRJ: " : "EMP: ") & node.label}})',
        addEdge: '$create("northwind", "WORKSON", {"EMP": edge.source, "PROJECT": edge.target})',
        removeEdge: '$delete("northwind", "WORKSON", edge.source, edge.target)'
    }

    // employee - project mixed 1:n + m:n
    widget = {
        nodes: '[$all("northwind", "EMP").{"id": ID, "database": "northwind", "table": "EMP", "position": {"x": X, "y": Y}, "data": {"label": "EMP: " & ID}}, $all("northwind", "PROJECT").{"id": ID, "database": "northwind", "table": "PROJECT", "position": {"x": X, "y": Y}, "data": {"label": "PRJ: " & ID}}]',
        edges: '[$all("northwind", "WORKSON").{"id": EMP & "-" & PROJECT, "source": EMP, "target": PROJECT}, $all("northwind", "PROJECT").{"id": ID & "-" & HEAD, "source": ID, "target": HEAD}]',
        addNode: '($create("northwind", node.metaKey ? "PROJECT" : "EMP", {"ID": node.label, "X": node.position.x, "Y": node.position.y}); {"id": node.label, "position": node.position, "database": "northwind", "table": node.metaKey ? "PROJECT" : "EMP", "data": {"label": (node.metaKey ? "PRJ: " : "EMP: ") & node.label}})',
        addEdge: 'edge.sourceNode.table = "EMP" ? $create("northwind", "WORKSON", {"EMP": edge.source, "PROJECT": edge.target}) : $update("northwind", "PROJECT", edge.source, {"HEAD": edge.target})',
        removeEdge: 'edge.sourceNode.table = "EMP" ? $delete("northwind", "WORKSON", edge.source, edge.target) : $update("northwind", "PROJECT", edge.source, {"HEAD": null})'
    }

    // org chart with different addNode semantics (only CITY=London are part of the diagram)
    widget = {
        nodes: '$all("northwind", "EMPLOYEES")[CITY = "London"].{"id": $string(EMPLOYEE_ID), "database": "northwind", "table": "EMPLOYEES", "position": {"x": X, "y": Y}, "data": {"label": LAST_NAME}}',
        edges: '$all("northwind", "EMPLOYEES")[REPORTS_TO != null].{"id": $string(EMPLOYEE_ID) & "-" & $string(REPORTS_TO), "source": $string(EMPLOYEE_ID), "target": $string(REPORTS_TO)}',
        addNode: '($id := $all("northwind", "EMPLOYEES", null, null, null, false, {"LAST_NAME": node.label})[0].EMPLOYEE_ID; $update("northwind", "EMPLOYEES", $id, {"CITY": "London", "X": node.position.x, "Y": node.position.y}) ; {"id": "" & $id, "position": node.position, "data": {"label": node.label}, "database": "northwind", "table": "EMPLOYEES"})',
        addEdge: '$update("northwind", "EMPLOYEES", edge.source, {"REPORTS_TO": edge.target})',
        removeEdge: '$update("northwind", "EMPLOYEES", edge.source, {"REPORTS_TO": null})',
        removeNode: '$update("northwind", "EMPLOYEES", node.id, {"CITY": null})'
    }

    // custom move node impl: only save Y coord
    widget = {
        nodes: '$all("northwind", "EMPLOYEES").{"id": $string(EMPLOYEE_ID), "database": "northwind", "table": "EMPLOYEES", "position": {"x": X, "y": Y}, "data": {"label": LAST_NAME}}',
        moveNode: '$update("northwind", "EMPLOYEES", node.id, {"Y": node.position.y})'
    }

    // DICE Komponentenbaum
    widget = {
        nodes: '[$all("metadata", "Schritt")[Komponentenbaum = "Einzelgeschäft"].{"id": ID, "database": "metadata", "table": "Schritt", "data": {"label" : "Schritt: " & ID}, "position": {"x": X, "y": Y}}, ($nodes := $all("metadata", "Schritt")[Komponentenbaum = "Einzelgeschäft"]; $distinct([$nodes.output, $nodes.input1, $nodes.input2])[$ != null].$read("metadata", "Glossar", $).{"id": ID, "database": "metadata", "table": "Glossar", "position": {"x": X, "y": Y}})]',
        edges: '($s := $all("metadata", "Schritt")[Komponentenbaum = "Einzelgeschäft"]; [$s.{"id": ID, "source": ID, "target": output}, $s.{"id": ID & "_1", "source": input1, "target": ID}, $s.{"id": ID & "_2", "source": input2, "target": ID}])',
        addEdge: '$update("metadata", "Schritt", edge.source, {"output": edge.target})',
        removeEdge: '$update("metadata", "Schritt", edge.source, {"output": null})',
        addNode: '($create("metadata", "Schritt", {"ID": node.label, "Komponentenbaum": "Einzelgeschäft", "X": node.position.x, "Y": node.position.y}) ; {"id": node.label, "position": node.position, "data": {"label": "Schritt: " & node.label}, "database": "metadata", "table": "Schritt"})',
    }

*/
export const Diagram = ({ widget }: { widget: Widget }) => {

    const nodes = useExpression(widget.cached!, widget.nodes)
    const edges = useExpression(widget.cached!, widget.edges)

    if (nodes.isLoading) return <Loading />
    if (nodes.error) return <PrintError error={nodes.error}></PrintError>
    if (edges.isLoading) return <Loading />
    if (edges.error) return <PrintError error={edges.error}></PrintError>

    if (!Array.isArray(edges.data))
        edges.data = typeof edges.data === 'object' ? [edges.data] : []
    if (!Array.isArray(nodes.data))
        nodes.data = typeof nodes.data === 'object' ? [nodes.data] : []

    let hasXY = false

    // node sanity checks
    const nodeset = new Set()
    for (const node of nodes.data) {
        if (!(node?.database && node?.table))
            return <p>The diagram nodes must contain database and table</p>
        if (!util.isValue(node.id))
            return <p>The diagram nodes must contain an id</p>
        // make sure position is present (defaults to (0,0))
        if (!node.position)
            node.position = {}
        if (!node.data)
            node.data = {}
        // label defaults to id
        if (!node.data.label)
            node.data.label = node.id
        node.id = '' + node.id
        nodeset.add(node.id)
        if (util.isValue(node.position?.x))
            hasXY = true
        if (util.isValue(node.position?.y))
            hasXY = true
    }
    if (nodeset.size < nodes.data.length)
        return <p>Your diagram uses duplicate node ids</p>

    // edge sanity checks
    let sourceOrTarget = 0
    const edgeset = new Set()
    for (const edge of edges.data) {
        if (!edge)
            continue
        // show a message if all edges are missing this
        if (edge.source && edge.target)
            sourceOrTarget++
        if (util.isValue(edge.source))
            edge.source = '' + edge.source
        if (util.isValue(edge.target))
            edge.target = '' + edge.target
        if (!util.isValue(edge.id))
            edge.id = edge.source + '-' + edge.target
        edge.id = '' + edge.id
        edge.markerEnd = {
            type: MarkerType.ArrowClosed,
            width: 20,
            height: 20
        }
        edgeset.add(edge.id)
    }
    if (edgeset.size > 0)
        if (sourceOrTarget === 0)
            return <p>The diagram edges must contain source and target</p>
    if (edgeset.size < edges.data.length)
        return <p>Your diagram uses duplicate edge ids (defaults to source-target)</p>

    if (!hasXY && nodes.data.length > 0) {
        // Create a new directed graph 
        var g = new Dagre.graphlib.Graph();

        // Set an object for the graph label
        g.setGraph({});

        // Default to assigning a new object as a label for each new edge.
        g.setDefaultEdgeLabel(function () { return {}; });

        // Add nodes to the graph. The first argument is the node id. The second is
        // metadata about the node. In this case we're going to add labels to each of
        // our nodes.
        for (const node of nodes.data)
            g.setNode(node.id, { label: node.id, width: 150, heigth: 100 })

        // Add edges to the graph.
        for (const edge of edges.data)
            g.setEdge(edge.source, edge.target);

        Dagre.layout(g);

        for (const node of nodes.data) {
            node.position = {
                x: g.node(node.id).x,
                y: g.node(node.id).y
            }
        }
    }

    return <ReactFlowProvider>
        <Flow widget={widget} initialNodes={nodes.data} initialEdges={edges.data}></Flow>
    </ReactFlowProvider>
}

const Flow = ({ widget, initialNodes, initialEdges }: { widget: Widget, initialNodes: any, initialEdges: any }) => {

    const reactFlowWrapper = useRef(null);
    const { project } = useReactFlow();
    const context = useExpressionContext()
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const dataProvider = useDataProvider()
    const notify = useNotify()
    const navigate = useNavigate()
    const refresh = useRefresh()

    const getNode = (id: string): any => {
        for (const node of nodes)
            if (node.id === id)
                return node
        return null
    }

    const getEdge = (id: string): any => {
        for (const edge of edges)
            if (edge.id === id)
                return edge
        return null
    }

    const onConnect = useCallback((params: any) => setEdges((eds) => {
        params.markerEnd = {
            type: MarkerType.ArrowClosed,
            width: 20,
            height: 20
        }
        return addEdge(params, eds)
    }), [setEdges]);

    // call backend with error handling
    const expression = (expression?: string): Promise<any> => {
        try {
            if (expression)
                return action.isAction(expression) ? dataProvider.action(expression, context, notify, refresh, navigate) : dataProvider.expression(expression, context)
        }
        catch (err) {
            notify(util.error(err), { type: 'error' })
        }
        return Promise.resolve(undefined)
    }

    return (
        <>
            <div ref={reactFlowWrapper} style={{ width: widget.style?.width, height: widget.style?.height ? widget.style?.height : 400 }}>
                <ReactFlow
                    fitView
                    nodes={nodes}
                    edges={edges}
                    onNodeClick={(_, node: any) => {
                        if (node.database && node.table)
                            navigate('/' + node.database + '/' + encodeURIComponent(node.table) + '/' + encodeURIComponent(node.id))
                    }}
                    onNodesChange={async (changes: NodeChange[]) => {
                        for (const change of changes) {
                            if (change.type === 'position' && !change.dragging) {
                                const node = getNode(change.id)
                                if (widget.moveNode) {
                                    context.node = node
                                    await expression(widget.moveNode)
                                } else {
                                    try {
                                        if (node.database && node.table)
                                            dataProvider.update(util.toResource({ dj: '', database: node.database, table: node.table }), { id: change.id, data: { id: change.id, X: node.position.x, Y: node.position.y }, previousData: {} })
                                    }
                                    catch (err) {
                                        notify(util.error(err), { type: 'error' })
                                    }
                                }
                            }
                            if (change.type === 'remove') {
                                const node = getNode(change.id)
                                if (widget.removeNode) {
                                    context.node = node
                                    await expression(widget.removeNode)
                                } else {
                                    try {
                                        await dataProvider.delete(util.toResource({ dj: '', database: node.database, table: node.table }), { id: change.id })
                                    }
                                    catch (err) {
                                        notify(util.error(err), { type: 'error' })
                                    }
                                }
                            }
                        }
                        onNodesChange(changes)
                    }}
                    onEdgesChange={async (changes: EdgeChange[]) => {
                        for (const change of changes) {
                            if (change.type === 'remove') {
                                const edge = getEdge(change.id)
                                context.edge = edge
                                await expression(widget.removeEdge)
                            }
                        }
                        onEdgesChange(changes)
                    }}
                    onConnect={async (connection: Connection) => {
                        context.edge = connection
                        context.edge.sourceNode = getNode(connection.source!)
                        context.edge.targetNode = getNode(connection.target!)
                        await expression(widget.addEdge)
                        onConnect(connection)
                    }}
                    onPaneClick={async (event: any) => {
                        if (!event.shiftKey && !event.metaKey)
                            return
                        const label = prompt('Enter name')
                        if (label) {
                            const { top, left } = (reactFlowWrapper.current as any).getBoundingClientRect();
                            // compute id and new record
                            context.node = {
                                label,
                                shiftKey: event.shiftKey,
                                metaKey: event.metaKey,
                                position: project({ x: event.clientX - left, y: event.clientY - top }),
                            }
                            const node = widget.addNode ? await expression(widget.addNode) : {
                                data: { label },
                                id: 'node' + Math.floor(Math.random() * 1000000),
                                position: context.node.position
                            }
                            nodes.push(node)
                            setNodes([...nodes])
                        }
                    }}
                >
                    <Controls />
                    <MiniMap />
                    <Background variant={"dots" as any} gap={12} size={1} />
                </ReactFlow>
            </div >
        </>
    );
}

export default Diagram

export const config = {
    id: 'diagram',
    title: 'Diagram',
    description: 'Edit Relationships on a Diagram',
    version: 1,
    icon: <Icon>add_circle</Icon>,
    controls: {
        type: 'autoform',
        schema: {
            properties: {
                title: title,
                style: style,
                nodes: { title: 'Expression to generate nodes', uniforms: { component: Expression } },
                edges: { title: 'Expression to generate edges', uniforms: { component: Expression } },
                moveNode: { title: 'Expression to perform moving a node', uniforms: { component: Expression } },
                addNode: { title: 'Expression to perform adding a node', uniforms: { component: Expression } },
                removeNode: { title: 'Expression to perform removing a node', uniforms: { component: Expression } },
                addEdge: { title: 'Expression to perform adding an edge', uniforms: { component: Expression } },
                removeEdge: { title: 'Expression to perform removing an edge', uniforms: { component: Expression } }
            }
        }
    }
}