import { ExportButton, FilterButton, SelectColumnsButton, TopToolbar } from "react-admin";

export const Actions = () => (
    <TopToolbar>
        <FilterButton></FilterButton>
        <SelectColumnsButton />
        <ExportButton maxResults={1000000} />
    </TopToolbar>
);