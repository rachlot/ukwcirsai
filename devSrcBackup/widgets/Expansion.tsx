import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Accordion, AccordionDetails, AccordionSummary, Typography } from "@mui/material";
import { Widget } from '../model/widget';
import Container from "./Container";
import { useContext, useState } from 'react';
import { roles, text, title } from '../api/Const';
import { Icon } from '@mui/material'
import { EditContext } from '../App';

/**
 * draw card and title and delegate to container
 */
function Expansion({ widget, children }: { widget: Widget, children: any }) {

    const edit = useContext(EditContext)
    const [expanded, setExpanded] = useState(edit)

    return <Accordion sx={{ marginBottom: '10px' }} expanded={expanded} onChange={(e, ex) => setExpanded(ex)}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>{widget.text}</Typography>
        </AccordionSummary>
        <AccordionDetails>
            <Container widget={widget} >{children}</Container>
        </AccordionDetails>
    </Accordion >
}

export default Expansion

export const config = {
    id: 'expansion',
    title: 'Expansion',
    description: 'Expandable panel that can contain other widgets',
    version: 1,
    icon: <Icon>expand</Icon>,
    controls: {
        type: 'autoform',
        schema: {
            properties: {
                title: title,
                text: text,
                roles: roles
            }
        }
    }
}