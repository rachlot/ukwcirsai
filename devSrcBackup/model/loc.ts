/**
 * struct to hold location info computed from browser location
 */
export interface Loc {

    /**
     * URL type:
     * 
     * resource shows a record that exists in some database
     * table show a table that exists in some database
     * dashboard page "float's" freely 
     * search page displays search results
     */
    type: 'resource' | 'table' | 'page' | 'search'

    /**
     * the database we search, show a record or table
     */
    database?: string

    /**
     * the table we search, show, or show a record of
     */
    table?: string

    /**
     * the id / key of the record we show
     */
    id?: string

    /**
     * the dashboard we show
     */
    page?: string

    /**
     * search term
     */
    search?: string

    /**
     * the optional ?page parameter
     */
    withPage?: string
}