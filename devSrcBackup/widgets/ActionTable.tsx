import { Icon } from '@mui/material';
import { DataProviderContext } from "ra-core";
import { Loading } from "ra-ui-materialui";
import { action as actionConst, expression, perPage, title } from "../api/Const";
import { constDataProvider } from "../api/ConstDataProvider";
import { util } from "../api/Util";
import { MyListGuesser } from "../components/MyListGuesser";
import { PrintError } from "../components/PrintError";
import { useExpression } from "../hooks/useExpression";
import { Widget } from "../model/widget";
import {
    useDataProvider,
    useListContext,
    useRefresh,
    useNotify,
    useUnselectAll,
    Button,
} from 'react-admin';
import { dataProvider } from '../api/DjDataProvider';
import { action } from '../api/Action';
import { useNavigate } from "react-router";
import { useExpressionContext } from '../hooks/useExpressionContext';
import { EditButton } from 'react-admin';

/**
 * table widget that renders jsonata as a table and offer table actions
 */
export const ActionTable = ({ widget }: { widget: Widget }) => {

    let { data, isLoading, error } = useExpression(widget.cached!, widget.expression!)

    if (isLoading) return <Loading />
    if (error) return <PrintError error={error}></PrintError>

    // single result not wrapped in array
    if (util.isObject(data))
        data = [data]

    if (!widget.expression)
        return <span>ActionTable - please provide an expression that computes a table</span>

    if (!util.isTable(data))
        return <span>No data available</span>

    // infer schema
    const schema = util.inferSchemaFromData(data)

    // project widget columns
    if (widget.columns && schema.properties)
        for (const col of Object.keys(schema.properties))
            if (!widget.columns.includes(col))
                delete schema.properties[col]

    // append the data's length in order to make the table update
    const resource = widget.expression + data.length

    return <DataProviderContext.Provider value={constDataProvider.create(data)}>
        <MyListGuesser schema={schema!} resource={resource} selectable={false} bulkActionButtons={<Actions resource={resource} widget={widget}></Actions>} perPage={widget.perPage}></MyListGuesser>
    </DataProviderContext.Provider>
}

export default ActionTable

export const config = {
    id: 'actionTable',
    title: 'Action Table',
    description: 'Show expression in table and offer action for selected rows',
    version: 1,
    icon: <Icon>table</Icon>,
    controls: {
        type: 'autoform',
        schema: {
            required: ['title'],
            properties: {
                title: title,
                expression: expression,
                properties: actionConst,
                perPage: perPage
            }
        }
    }
}

const Actions = ({ widget, resource }: { widget: Widget, resource: string }) => {

    const constDataProvider = useDataProvider()
    const { selectedIds } = useListContext();
    const notify = useNotify()
    const refresh = useRefresh()
    const navigate = useNavigate()
    const unselectAll = useUnselectAll(resource);
    const context = useExpressionContext()

    let i = 0
    return <>
        {Object.entries(widget.properties ? widget.properties : {}).map(([k, v]) =>
            <Button key={i++} onClick={async () => {
                context.selected = []
                for (const id of selectedIds) {
                    const record = (await constDataProvider.getOne(widget.expression!, { id })).data
                    context.selected.push(record)
                }
                try {
                    const res = action.isAction(v) ? await dataProvider.action(v, context, notify, refresh, navigate) : await dataProvider.expression(v, context)
                    if (!v.includes('$notify('))
                        notify(util.isValue(res) ? util.stringify(res) : 'Ok')
                }
                catch (err) {
                    notify(util.error(err), { type: 'error' })
                    return
                }
                unselectAll()
            }}>
                <div style={{ fontSize: 'small' }}>{k}</div>
            </Button>
        )}
    </>
}