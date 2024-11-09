import { Loading } from "react-admin";
import { useTemplate } from "../hooks/useTemplate";
import { PrintError } from "../components/PrintError";

/**
 * renders a text (e.g. Table: ${value.name})
 */
export const TemplateText = ({ text }: { text: string }) => {

    const { data, isLoading, error } = useTemplate(text)
    if (isLoading) return <Loading />
    if (error) return <PrintError error={error}></PrintError>

    return <>{data}</>
}
