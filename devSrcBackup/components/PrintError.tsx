import { util } from "../api/Util"

/**
 * render error in place
 * centralize here so we can apply changes easily
 */
export const PrintError = ({ error }: { error: any }) => {
    return <p>{util.error(error)}</p>
}