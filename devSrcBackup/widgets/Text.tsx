import { Value } from "../components/Value";
import { Widget } from "../model/widget";
import { href, icon, text, title } from "../api/Const"
import { Icon } from '@mui/material'
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import { helper } from "../components/helper";
import { Loading } from "react-admin";
import { useTemplate } from "../hooks/useTemplate";
import { PrintError } from "../components/PrintError";

/**
 * text widget for icons / links / texts
 * delegate to Value
 */
function Text({ widget }: { widget: Widget }) {

    if (!widget.text)
        return <p>Text - Please provide a text</p>

    if (widget.text.includes("${"))
        return <TextHelper widget={widget} />

    if (!widget.icon)
        return <Value data={widget.href ? { label: widget.text, href: widget.href } : widget.text} />
    else
        // cannot be handled by Value 
        return <List>
            <ListItem >
                <ListItemIcon><Icon>{widget.icon}</Icon></ListItemIcon>
                <ListItemText primary={widget.href ? helper({ label: widget.text, href: widget.href }) : widget.text}></ListItemText>
            </ListItem>
        </List>
}

/**
 * compute template and call text again
 */
const TextHelper = ({ widget }: { widget: Widget }) => {
    const { data, isLoading, error } = useTemplate(widget.text!)
    if (isLoading) return <Loading />
    if (error) return <PrintError error={error}></PrintError>

    // copied and pasted from Text (avoid recursion)
    if (!widget.icon)
        return <Value data={widget.href ? { label: data, href: widget.href } : data} />
    else
        // cannot be handled by Value 
        return <List>
            <ListItem >
                <ListItemIcon><Icon>{widget.icon}</Icon></ListItemIcon>
                <ListItemText primary={widget.href ? helper({ label: data, href: widget.href }) : data}></ListItemText>
            </ListItem>
        </List>
}

export default Text

export const config = {
    id: 'text',
    title: 'Text',
    description: 'Simple text or link',
    version: 1,
    icon: <Icon>title</Icon>,
    controls: {
        type: 'autoform',
        schema: {
            properties: {
                title: title,
                text: text,
                icon: icon,
                href: href,
            }
        }
    }
}
