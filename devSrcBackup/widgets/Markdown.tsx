import { marked } from "marked";
import { Loading } from "ra-ui-materialui";
import { util } from "../api/Util";
import { useTemplate } from "../hooks/useTemplate";
import { Widget } from "../model/widget";
import { card, context, markdown, title } from "../api/Const";
import { Icon } from '@mui/material'
import { PrintError } from "../components/PrintError";
import { EditContext } from "../App";
import { useContext } from "react";

/**
 * renders markdown. 
 * The template can contain references to the
 * context via ${var}
 * 
 * the context is the "normal" context with an optional key "context" that
 * is initialized with the result of a jsonata expression:
 * 
 * user: current user
 * value: current record
 * context: jsonata result
 */
export const Markdown = ({ widget }: { widget: Widget }) => {

    const edit = useContext(EditContext)
    const { data, isLoading, error } = useTemplate(widget.markdown!, widget.context)

    if (edit && !data)
        return <p>Markdown</p>

    if (isLoading || !util.isValue(data)) return <Loading />
    if (error) return <PrintError error={error}></PrintError>

    // replace legacy links and render
    return <div dangerouslySetInnerHTML={{ __html: marked.parse(data!) }} />
}

/**
 * Component
 */
export default Markdown;

/**
 * Metadata
 */
export const config = {
    id: 'markdown',

    // capitalized version
    title: 'Markdown',

    // description in widget chooser
    description: 'Display Markdown text',
    version: 1,
    icon: <Icon>text_snippet</Icon>,
    controls: {
        type: 'autoform',
        schema: {
            properties: {
                title: title,
                card: card,
                markdown: markdown,
                context: context
            },
        },
    }
}
