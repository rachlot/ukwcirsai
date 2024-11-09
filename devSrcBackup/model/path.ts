import { Resource, isResource } from "./resource"

/**
 * path structure returned if a cypher graph query returns a path variable
 */
export interface Path {
    start: {
        _dj_resource: Resource
    },
    steps: {
        edge: {
            _dj_edge: string,
            _dj_outbound: boolean
        },
        end: Resource
    }[]
}

export const isPath = (p: any): boolean => {
    return isResource(p.start?._dj_resource) && Array.isArray(p.steps) && p.steps.reduce((acc: boolean, step: any) => acc && isResource(step?.end?._dj_resource), true)
}