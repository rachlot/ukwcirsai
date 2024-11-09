/**
 * Resource: represents an object ID
 */
export interface Resource {

    database: string,
    table: string,
    pk: any[]
}

export const isResource = (r: any): boolean => {
    return r && r.database && r.table && Array.isArray(r.pk)
}
