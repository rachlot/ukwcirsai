import { useRecordContext } from "ra-core"
import { useTableContext } from "./TableContext"
import { useLoc } from "./useLoc"
import { profile } from "../api/Profile"
import { useContext } from "react"
import { ValueContext } from "../App"

/**
 * expression context sent to backend for eval
 */
export const useExpressionContext = (): any => {

    const loc = useLoc()
    let value: any = useRecordContext()
    const tableContext = useTableContext()
    const foreachContext = useContext(ValueContext)

    // TODO: value should be table schema
    if (!value && loc.type === 'table')
        value = tableContext

    if (foreachContext)
        value = foreachContext

    return {
        database: loc.database,
        table: loc.table,
        pk1: loc.id,
        loc,
        user: profile.getUser(),
        email: profile.getEmail(),
        roles: profile.getRoles(),
        href: window.location.href,
        variable: profile.getVariable(),
        value
    }
}