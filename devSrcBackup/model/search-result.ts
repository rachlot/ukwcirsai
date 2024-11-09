import { Resource } from "./resource";

/**
 * represents a search result
 */
export interface SearchResult {
    id: Resource,
    column: string,
    match: any
}