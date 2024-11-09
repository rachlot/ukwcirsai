import { useEffect, useState } from 'react';
import { useDataProvider, useNotify, useRefresh } from 'react-admin';
import { util } from '../api/Util';
import { action } from '../api/Action';
import { useNavigate } from "react-router";
import { useLoc } from '../hooks/useLoc';

/**
 * component to preview JSONata results
 * given the expression and the context, evaluates expression(context)
 * the results are displayed in a scrollable text field 
 */
const ExpressionPreview = ({ expression, context, foreach }: { expression: string, context: any, foreach: boolean }) => {
    if (!expression)
        expression = ''

    const debounce = expression // useDebounce(expression, 1000)
    const dataProvider = useDataProvider()
    const [result, setResult] = useState<string>('')
    const notify = useNotify()
    const refresh = useRefresh()
    const navigate = useNavigate()
    const loc = useLoc()

    useEffect(() => {
        (action.isAction(debounce) ? dataProvider.actionPreview(debounce, context, foreach, notify, refresh, navigate) : dataProvider.expressionPreview(debounce, context, foreach)).then(
            (r: any) => {
                // boolean is ignore in the display
                if (typeof r === 'boolean')
                    r = '' + r
                setResult(debounce === '' ? '' : (typeof r === 'object' ? JSON.stringify(r, null, 2).substring(0, 1000000) : r))
            })
            .catch(
                (ex: any) => {
                    if (loc.database === 'config' && loc.table === 'dj-function' && debounce?.trim() === '$index()')
                        // make sure the user can type $index() initially without getting an error
                        setResult('0')
                    else
                        setResult(util.error(ex))
                }
            )
    }, [debounce, context, dataProvider, foreach, loc.database, loc.table, navigate, notify, refresh])

    return <pre style={{
        fontSize: 'small',
        overflowY: 'auto',
        maxHeight: '20em',
        overflowX: 'auto',
        maxWidth: 'calc(100vw - 32px - 24px - 200px)'
    }}>
        {result}
    </pre>
}

export default ExpressionPreview