import { Schema } from "./schema";

/**
 * widget data structure
 */
export interface Widget {

    /**
     * card title
     */
    title?: string,

    /**
     * display within card
     */
    card?: boolean

    /**
     * icon tooltip
     */
    tooltip?: string,

    /**
     * text / icon href
     */
    href?: string,

    /**
     * widget selector
     */
    widget?: string,

    /**
     * widget can be in draft which means visible in layout editor but not in view mode
     */
    isDraft?: boolean,

    /**
     * icon for text and icon widget
     */
    icon?: string,

    /**
     * container's kids
     */
    children?: Widget[]

    /**
     * table expression (alternative to query)
     */
    expression?: string

    /**
     * button navigate expression
     */
    navigate?: string

    /**
     * button print expression
     */
    print?: string

    /**
     * container if render expression
     */
    if?: string

    /**
     * show only for these roles
     */
    roles?: string[]

    /**
     * display expression
     */
    display?: string

    /**
     * markdown expression
     */
    context?: string

    /**
     * text for expansion and text widgets
     */
    text?: string

    /**
     * query to use
     */
    query?: string

    /**
     * db to query
     */
    database?: string

    /**
     * table to query (analytics query)
     */
    table?: string

    /**
     * expression that computes the query arguments
     */
    arguments?: string

    /**
     * used by display widget to specify map icons
     */
    icons?: { [key: string]: string }

    /**
     * markdown source
     */
    markdown?: string

    /**
     * html source
     */
    html?: string

    /**
     * javascript source
     */
    script?: string

    /**
     * responsive toolbar
     */
    fxHide?: string;

    /**
     * custom widget style
     */
    style?: { [key: string]: string }

    /**
     * properties for button / variable widgets
     * (deprecated - use createSchema directly)
     */
    properties?: { [key: string]: string }

    /**
     * deprecated - use schema
     */
    createSchema?: Schema

    /**
     * custom form for edit / create / button / variable
     */
    schema?: Schema

    /**
     * chart type
     */
    chart?: 'table' | 'bar' | 'line' | 'doughnut' | 'radar' | 'polarArea';

    /**
     * size of the widget in the current 12-tile layout
     */
    size?: number

    /**
     * confirmation before performing delete or another action
     */
    deleteConfirmation?: string

    /**
     * hide delete in edit widget
     */
    noDelete?: boolean

    /**
     * query is a graph query
     */
    graph?: boolean

    /**
     * edit related prop
     */
    prop?: string

    /**
     * columns to display in the editRelated table display
     */
    columns?: string[];

    /**
     * expression to get diagram nodes
     */
    nodes?: string

    /**
     * expression to get diagram edges
     */
    edges?: string

    /**
     * expression to perform diagram node move
     */
    moveNode?: string

    /**
     * expression to perform diagram node delete
     */
    removeNode?: string

    /**
     * expression to perform diagram edge delete
     */
    removeEdge?: string

    /**
     * expression to perform diagram node add
     */
    addNode?: string

    /**
     * expression to perform diagram edge add
     */
    addEdge?: string

    /**
     * container redraw interval
     */
    redrawInterval?: number

    /**
     * 3D graph
     */
    _3d?: boolean

    /**
     * cached query or expression
     */
    cached?: boolean

    /**
     * page attribute to run some expression on page render
     */
    onRender?: string

    /**
     * default number of rows to show in a table
     */
    perPage?: number

    /**
     * edit widget redirect after save
     * table: back to table view (default)
     * record: stay on record page
     * page/Dashboard, db/table, db/table/id: navigate to fixed page
     */
    editRedirect?: string

    /**
     * edit widget redirect after delete
     */
    deleteRedirect?: string

    header?: string

    subTitle?: string
}
