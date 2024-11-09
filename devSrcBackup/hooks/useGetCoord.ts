import { useDataProvider } from "ra-core";
import { useQuery } from "react-query";
import { useExpressionContext } from "./useExpressionContext";
import { MapData, mapUtil } from "../api/MapUtil";

/**
 * get the MapData from the expression 
 */
export const useGetCoord = ({ expression }: { expression: string }) => {

    const dataProvider = useDataProvider()
    const context = useExpressionContext()

    return useQuery<MapData>(
        ['expression', expression, context],
        async () => {
            const res = await dataProvider.expression(expression, context)
            const data = mapUtil.cast(res)
            if (data.points)
                for (const point of data.points)
                    if (point.address) {
                        const api = await mapUtil.getLocation(point.address)
                        point.boundingbox = api.boundingbox
                        point.location = {
                            lat: api.lat, lon: api.lon
                        }
                    }

            if (!data.center)
                data.center = mapUtil.center(data.points)

            if (!data.zoom)
                data.zoom = mapUtil.defaultZoom(data.points)

            return data
        }
    );
}
