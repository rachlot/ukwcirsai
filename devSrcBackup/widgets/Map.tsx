import "leaflet/dist/leaflet.css";
import { Loading } from "ra-ui-materialui";
import { CircleMarker, MapContainer, Popup, TileLayer, Tooltip } from 'react-leaflet';
import { useGetCoord } from "../hooks/useGetCoord";
import { Widget } from "../model/widget";
import { card, display, style, title } from "../api/Const";
import { Icon } from '@mui/material'
import { PrintError } from "../components/PrintError";
import { Value } from "../components/Value";

/**
 * load expression and display it using open streemap
 */
function Map({ widget }: { widget: Widget }) {

    const { data, isLoading, error } = useGetCoord({ expression: widget.display! })
    if (!widget.display)
        return <p>Map - please edit display expression</p>
    if (!data) return <Loading />
    if (isLoading) return <Loading />
    if (error) return <PrintError error={error}></PrintError>

    const style: any = widget.style ? { ...widget.style } : {}
    if (!style.height)
        style.height = '400px'
    if (!style.marginBottom)
        style.marginBottom = '10px'

    let i = 0
    return (
        <MapContainer
            center={[data.center!.lat, data.center!.lon]}
            zoom={data.zoom}
            style={style}
        >
            {data.points?.map((p: any) => <CircleMarker key={i++}
                center={p.location}
                color={p.color ? p.color : '#3388ff'}
                radius={p.radius ? p.radius : 10}
            >
                <>test</>
                {p.tooltip ? <Tooltip><Value data={p.tooltip}></Value></Tooltip> : <></>}
                {p.popup ? <Popup><Value data={p.popup}></Value></Popup> : <></>}
            </CircleMarker>)}
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
        </MapContainer>)
}

export default Map

/**
 * Metadata
 */
export const config = {
    id: 'map',

    // capitalized version
    title: 'Map',

    // description in widget chooser
    description: 'Map to show a given address',
    version: 1,
    icon: <Icon>map</Icon>,
    controls: {
        type: 'autoform',
        schema: {
            properties: {
                title: title,
                card: card,
                display: display,
                style: style
            },
        },
    }
}
