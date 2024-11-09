/**
 * get options
 */
export interface DJDataGetOptions {

    /**
     * desired size of the result
     */
    pageSize?: number;

    /**
     * paging cursor (maybe next style id in the future)
     */
    cursor?: number;

    /**
     * desired sorting - may support multi col sort later
     */
    sort?: DJSort;

    /**
     * can be a filter map where we interpret where key1=value1 and ...
     */
    arguments?: any
}

/**
 * column sorting info
 */
export interface DJSort {
    /**
     * must match one of the schema.properties
     */
    field: string;

    /**
     * sort order
     */
    order: 'asc' | 'desc' | undefined;
}
