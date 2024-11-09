
/**
 * TS equivalent of the backend sturcture.
 * represents the state of the mapping editor that is passed back and forth
 */
export interface Result {

    /**
     * source tables (limited to 10 rows)
     */
    source: { [key: string]: { [key: string]: any }[] };

    /**
     * mapping result
     */
    result: { [key: string]: { [key: string]: any }[] };

    /**
     * mapping (one per result table)
     */
    mappings?: { [key: string]: Mapping };

    /**
     * table columns
     */
    columns: { [key: string]: string[] };

    /**
     * table datatypes
     */
    datatypes: { [key: string]: string[] };

    /**
     * sanity check
     */
    warning?: string;

    /**
     * indicates whether the source should create the schema / i.e. the editor needs to worry about
     * PKs or not
     */
    createSchema: boolean;
}

/**
 * TS equivalent of the backend class
 */
export interface Mapping {

    /**
     * apply the mapping to this source table
     */
    sourceTable?: string;

    /**
     * column containing the array
     */
    childTable?: string;

    /**
     * the name of the PK column (we do not support composite keys here) only required if the create
     * option is true
     */
    pk?: string;

    /**
     * jsonata expression which is applied to each row - must yield a record object
     */
    rowMapping?: { [key: string]: string };
}
