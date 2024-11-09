/**
 * JSON schema description of a property
 */
export interface Property {

    /**
     * property name
     */
    name: string;

    /**
     * property primary key
     */
    ID: string;

    /**
     * parent pk
     */
    parent: string;

    /**
     * null if prop is no PK, the position in the (composite) PK otherwise (starting from 0)
     */
    pkpos?: number;

    /**
     * null if the property is no FK, PK of the property it points to otherwise
     */
    ref?: string;

    /**
     * poperty type
     */
    type: string;

    /**
     * json schema title
     */
    title: string;

    /**
     * json schema description
     */
    description: string;

    /**
     * json schema nested properties
     */
    properties: { [key: string]: Property };
}

/**
 * represents a table
 */
export interface Table {

    /**
     * table name
     */
    name: string;

    /**
     * table PK
     */
    ID: string;

    /**
     * pk of the containing DB
     */
    parent: string;

    /**
     * defaults to object
     */
    type: string;

    /**
     * table columns
     */
    properties: { [key: string]: Property };
}

/**
 * metadata for a column in the result table
 */
export interface QueryColumn {

    /**
     * column / property PK
     */
    columnID: string;

    /**
     * display name (might be different due to query alias)
     */
    displayName: string;

    /**
     * col
     */
    col: Col;

    /**
     * datatype (JSON)
     */
    type: string;

    /**
     * native DB datatype
     */
    dbType: string;

    /**
     * if pk, name of the table, if fk, name of the target table
     */
    keyTable: string;

    /**
     * database we are operating on
     */
    database: string;

    /**
     * where condition applied to this column
     */
    where: string;

    /**
     * groupBy applied to this column
     */
    groupBy: string;

    /**
     * optional column schema
     */
    prop?: Property
}

/**
 * table and column name which uniquely identify a column within a database
 */
export interface Col {

    /**
     * column name
     */
    column: string;

    /**
     * table name
     */
    table: string;
}

/**
 * abstract base class for other requests
 */
export interface QueryDatabase {

    /**
     * the DB to query
     */
    database: string;

    /**
     * the query
     */
    query: string;

    /**
     * limit rows to return
     */
    limit?: number;
}

/**
 * abstract column modification request
 */
interface AbstractRequest extends QueryDatabase {

    /**
     * the column to modify / act on
     */
    col: Col;
}

/**
 * add / join col
 */
export interface AddColumnRequest extends AbstractRequest {

    /**
     * column to add / join
     */
    add: Col;

    /**
     * sample data of the new column which might be joined (as a preview before we actually join)
     */
    preview: any;
}

/**
 * remove col
 */
export interface RemoveColumnRequest extends AbstractRequest {
    // inherited info on table + col is enough
}

/**
 * sort
 */
export interface SortRequest extends AbstractRequest {

    /**
     * sort order
     */
    order: string;
}

/**
 * rename
 */
export interface RenameRequest extends AbstractRequest {

    /**
     * new name
     */
    name: string;
}

/**
 * distinct
 */
export interface DistinctRequest extends QueryDatabase {

    /**
     * distinct yes / no
     */
    distinct: boolean;

    /**
     * limit to set in the query, null means no limit
     */
    querylimit?: number;
}

/**
 * set where clauses (for each col)
 */
export interface SetWhereRequest extends QueryDatabase {

    /**
     * array of col and new condition
     */
    cols: {
        col: Col,
        condition?: string
    }[];
}

/**
 * move col
 */
export interface MoveColumnRequest extends AbstractRequest {

    /**
     * new position
     */
    position: number;
}

/**
 * query result data and metadata
 */
export interface QueryResponse extends QueryDatabase {

    /**
     * tabluar query result
     */
    data: any[];

    /**
     * column metadata (array lenth equals number of data object fields)
     */
    metadata: QueryColumn[];

    /**
     * possible joins (including preview samples)
     */
    joinOptions: AddColumnRequest[];

    /**
     * field order
     */
    fieldNames: string[];

    /**
     * contains the reason in case the query is legal but not supported in the editor
     */
    compatibilityError: string;

    /**
     * Distinct query
     */
    distinct: boolean;

    /**
     * limit to set in the query, null means no limit
     */
    querylimit?: number;
}
