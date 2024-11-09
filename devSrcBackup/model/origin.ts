import { Resource } from "./resource";

/**
 * represents an incoming (fk) link to an object
 */
export interface Origin {
    id: Resource,
    pk: string,
    fk: string
}