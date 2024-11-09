import { Loading } from "ra-ui-materialui";
import { Value } from "../components/Value";
import { Widget } from "../model/widget";
import { useExpression } from "../hooks/useExpression";
import { card, display, icons, title } from "../api/Const";
import { Icon } from '@mui/material'
import { PrintError } from "../components/PrintError";
import { util } from "../api/Util";
import { useContext } from "react";
import { EditContext } from "../App";

/**
 * evaluate expression and use Value to display
 */
const Display = ({ widget }: { widget: Widget }) => {

    const edit = useContext(EditContext)
    const { data, isLoading, error } = useExpression(widget.cached!, widget.display)
    if (isLoading) return <Loading />
    if (error) return <PrintError error={error}></PrintError>

    if (!widget.display)
        return <span>Display - please edit display expression</span>

    if (edit) {
        // in edit mode, make sure widget is visible
        if (!util.isValue(data))
            return <span>Display</span>
        if ((typeof data === 'object') && Object.keys(data).length === 0)
            return <span>Display</span>
        if (Array.isArray(data) && data.length === 0)
            return <span>Display</span>
    }

    return <Value data={data} resource={widget.display} icons={widget.icons} />
}

export default Display

/**
 * Metadata
 */
export const config = {
    id: 'display',

    // capitalized version
    title: 'Display',

    // description in widget chooser
    description: 'Displays the result of expressions',
    version: 1,
    icon: <Icon>list</Icon>,
    controls: {
        type: 'autoform',
        schema: {
            properties: {
                title: title,
                card: card,
                display: display,
                icons: icons
            },
        },
    }
}
