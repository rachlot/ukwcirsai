import { Widget } from "../model/widget";
import Layout from "./Layout";
import { useMediaQuery } from '@mui/material';

/**
 * toolbar widget
 */
function Toolbar({ widget }: { widget: Widget }) {

    const pad = useMediaQuery('(min-width:906px)')
    const phone = useMediaQuery('(min-width:600px)')

    let i = 0
    return <>{widget.children?.map(kid =>
        <span
            key={i++}
            style={kid.widget === 'spacer' ? { 'flex': '1 1 auto' } : { paddingRight: '10px' }}
            className={kid.fxHide === 'lt-sm' ? 'phone' : (kid.fxHide === 'lt-md' ? 'pad' : '')}
        >
            {
                (kid.fxHide === 'lt-sm' && !phone) || (kid.fxHide === 'lt-md' && !pad) ? <></> : <Layout widget={kid} compid={kid.widget!}></Layout>
            }
        </span>
    )
    }</>
}

export default Toolbar
