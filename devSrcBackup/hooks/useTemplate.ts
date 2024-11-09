import { useDataProvider } from "ra-core";
import { useQuery } from "react-query";
import { util } from "../api/Util";
import { useExpressionContext } from "./useExpressionContext";

/**
 * evaluates a template that can contain references to the
 * context via ${var}
 * 
 * the context is the "normal" context with an optional key "context" that
 * is initialized with the result of a jsonata expression:
 * 
 * user: current user
 * value: current record
 * context: jsonata result
 */
export const useTemplate = (template: string, contextExpression?: string) => {
    const dataProvider = useDataProvider()
    const context = useExpressionContext()
    return useQuery(
        ['template', template, context, contextExpression],
        async () => {
            try {
                if (contextExpression)
                    context.context = await dataProvider.expression(contextExpression, context)
            } catch (err) {
                // ignore error since it triggers retry otherwise
            }
            const res = await util.template(template, context)
            // TODO: legacy links - replace in .json
            return res.replaceAll('/#/table/', '/#/').replaceAll('/#/resource/', '/#/')
        })
}
