import { useLocation } from "react-router"
import { Loc } from "../model/loc"
import { actions } from "../api/Action"
import { util } from "../api/Util"
import { useSearchParams } from 'react-router-dom';

/**
 * like useLocation, but parses the info into a location struct
 */
export const useLoc = (): Loc => {

    const location = useLocation()
    const [searchParams] = useSearchParams();

    for (const [key, value] of new URLSearchParams(location.search).entries())
        actions.setVariable.run(key, value)

    // avoid errors before the redirect kicks in
    if (location.pathname === '/')
        return {
            type: 'page',
            page: 'Home'
        }

    // #/----resource---/encodedID
    // #/db/encodedTable/encodedID
    const parts = location.pathname.split('/').map(x => decodeURIComponent(x))
    const res = util.parseLoc(parts)
    if (searchParams.get('page'))
        res.withPage = searchParams.get('page')!
    return res
}