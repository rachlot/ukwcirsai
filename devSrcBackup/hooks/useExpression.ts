import { useDataProvider, useNotify, useRefresh } from "ra-core";
import { useQuery } from "react-query";
import { useExpressionContext } from "./useExpressionContext";
import { action } from "../api/Action";
import { useNavigate } from "react-router";
import { useLoc } from "./useLoc";

/**
 * expression evaluation hook. takes care of the following:
 * 
 * makes sure we use a consistent query key
 * handles undefined expression by returning undefined
 */
export const useExpression = (cached: boolean, expression?: string) => {

    const dataProvider = useDataProvider()
    const context = useExpressionContext()
    const navigate = useNavigate()
    const notify = useNotify()
    const refresh = useRefresh()
    const loc = useLoc()

    // TODO: need to change dj-table-metadata
    if ('$not($contains(pk1, "/config/"))' === expression) {
        expression = 'database != "config"'
    }

    return useQuery(
        ['expression', expression, context],
        async () => {
            if (!expression)
                return Promise.resolve(undefined)

            if (expression === 'database != "config"')
                return Promise.resolve(loc.database !== 'config')

            return action.isAction(expression) ?
                dataProvider.action(expression, context, notify, refresh, navigate) :
                (cached ? dataProvider.expressionCached(expression, context) : dataProvider.expression(expression, context))
        }
    );
}