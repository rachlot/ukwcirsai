/**
 * see org.dashjoin.service.Data.ColInfo
 */
export interface ColInfo {
    name: string
    project?: boolean
    aggregation?: Aggregation
    filter?: Filter
    alias?: string

    // arg1 and arg2 are part of FilterInput and are merged before the query is sent

    // UI elements
    input: string
    label: string
}

export enum Aggregation {
    GROUP_BY, COUNT, COUNT_DISTINCT, MIN, MAX, GROUP_CONCAT, GROUP_CONCAT_DISTINCT, AVG, SUM, STDDEV
}

export enum Filter {
    EQUALS, NOT_EQUALS, LIKE, IS_NULL, IS_NOT_NULL, SMALLER_EQUAL, GREATER_EQUAL, BETWEEN
}

export interface FilterInput {
    name: string
    arg?: any
}