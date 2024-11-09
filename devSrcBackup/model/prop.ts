/**
 * struct to hold dj/table/table/property
 */
export interface Prop extends Tbl {
    property: string
}

/**
 * struct to hold dj/table/table
 */
export interface Tbl extends Db {
    table: string
}

/**
 * struct to hold dj/table
 */
export interface Db {
    dj: string
    database: string
}