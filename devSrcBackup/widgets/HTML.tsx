import { Icon } from '@mui/material'
import { context, html, script, title } from '../api/Const'
import { useTemplate } from '../hooks/useTemplate'
import { Widget } from '../model/widget'
import { util } from '../api/Util'
import { Loading } from 'react-admin'
import { PrintError } from '../components/PrintError'
import { Helmet } from 'react-helmet'
import { useExpression } from '../hooks/useExpression'
import { EditContext } from '../App'
import { useContext } from 'react'

/**
 * HTML widget
 * 
 * minimal implementation
 * no longer supports CSS and EJS
 */
export const HTML = ({ widget }: { widget: Widget }) => {

    const edit = useContext(EditContext)
    const x = useExpression(widget.cached!, widget.context)
    const { data, isLoading, error } = useTemplate(widget.html!, widget.context)

    if (edit && !data)
        return <p>HTML</p>

    if (x.isLoading) return <Loading />
    if (x.error) return <PrintError error={x.error}></PrintError>
    if (isLoading || !util.isValue(data)) return <Loading />
    if (error) return <PrintError error={error}></PrintError>

    return <>
        <Helmet>
            <script>{'var context = ' + JSON.stringify(x.data)}</script>
            <script>{widget.script}</script>
        </Helmet>
        <div dangerouslySetInnerHTML={{ __html: data! }} />
    </>
}

export default HTML

/**
 * Metadata
 */
export const config = {
    id: 'html',

    // capitalized version
    title: 'HTML',

    // description in widget chooser
    description: 'HTML widget',
    version: 1,

    icon: <Icon>html</Icon>,
    controls: {
        type: 'autoform',
        schema: {
            properties: {
                title: title,
                context: context,
                html: html,
                script: script
            },
        },
    }
}
