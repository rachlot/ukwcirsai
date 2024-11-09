import { Icon as I, IconButton, Tooltip } from "@mui/material";
import { Link } from "react-router-dom";
import { util } from "../api/Util";
import { Widget } from "../model/widget";
import { href, icon, roles, title, tooltip } from "../api/Const";
import { useLoc } from "../hooks/useLoc";
import { useContext } from "react";
import { EditContext } from "../App";
import { Tour } from "../components/Tour";

/**
 * draw an incon with hyperlink
 */
function Icon({ widget }: { widget: Widget }) {

    const loc = useLoc()
    const edit = useContext(EditContext)

    if (!widget.icon)
        return <p>Icon - Please provide an icon</p>

    let href = widget.href

    if (widget.icon === 'help_outline')
        return <Tour widget={widget} />

    return <Tooltip title={widget.tooltip}>
        {
            href ? <IconButton id={widget.icon} disabled={edit} color="inherit" component={Link} to={util.href(href)} target={href.startsWith('http') ? '_blank' : ''}>
                <I>
                    {widget.icon}
                </I>
            </IconButton> :
                <I>
                    {widget.icon}
                </I>
        }
    </Tooltip>
}

export default Icon

export const config = {
    id: 'icon',
    title: 'Icon',
    description: 'Icon with an optional link',
    version: 1,
    icon: <I>insert_emoticon</I>,
    controls: {
        type: 'autoform',
        schema: {
            properties: {
                title: title,
                href: href,
                tooltip: tooltip,
                roles: roles,
                icon: icon
            }
        }
    }
}