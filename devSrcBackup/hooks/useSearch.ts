import { useDataProvider } from "ra-core";
import { useQuery } from "react-query";
import { Loc } from "../model/loc";

/**
 * search evaluation hook
 */
export const useSearch = (loc: Loc) => {

    const dataProvider = useDataProvider()
    return useQuery(
        ['search', loc],
        () => {
            if (loc.table)
                return dataProvider.search(loc.search, loc.database, loc.table)
            else if (loc.database)
                return dataProvider.search(loc.search, loc.database)
            else
                return dataProvider.search(loc.search)
        }
    );
}