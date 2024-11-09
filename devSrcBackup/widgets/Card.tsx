import { Card as C, CardContent, Icon, Typography } from "@mui/material";
import { Widget } from "../model/widget";
import Container from "./Container";
import { roles, text, title } from "../api/Const";
import { TemplateText } from "../components/TemplateText";

/**
 * draw card and title and delegate to container
 */
function Card({ widget, children }: { widget: Widget, children: any }) {
    return <C sx={{ marginBottom: '10px' }}>
        <CardContent>
            {widget.text ? <Typography variant="h6"><TemplateText text={widget.text} /></Typography> : <></>}
            <Container widget={widget} >{children}</Container>
        </CardContent>
    </C>
}

export default Card

export const config = {
    id: 'card',
    title: 'Card',
    description: 'Card with nested widgets',
    version: 1,
    icon: <Icon>badge</Icon>,
    controls: {
        type: 'autoform',
        schema: {
            properties: {
                title: title,
                roles: roles,
                text: text
            }
        }
    }
}