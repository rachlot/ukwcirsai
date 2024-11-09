import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import { Tooltip, Icon, IconButton, Stack } from "@mui/material";
import { Loading, useDataProvider, useGetList } from 'react-admin';
import { HTMLFieldProps, connectField } from 'uniforms';
import { useLoc } from '../hooks/useLoc';
import { PrintError } from "../components/PrintError";

/**
 * uniforms custom component to select Queries
 * feeds the result of useGetList('config/dj-query-catalog') into the select options
 */
const Queries = ({ onChange, value }: HTMLFieldProps<string, HTMLDivElement>) => {

    const dp = useDataProvider()
    const loc = useLoc()

    const { data, isLoading, error } = useGetList('config/dj-query-catalog', {});
    if (isLoading) return <Loading />
    if (error) return <PrintError error={error}></PrintError>

    const options = data!.map((option) => option.ID)

    return <Stack direction={'row'}>
        <Autocomplete
            fullWidth
            freeSolo
            options={options}
            value={value ? value : ''}
            onChange={(event: any, newValue: string | null) => {
                onChange(newValue!);
            }}
            onInputChange={(event, newInputValue) => {
                onChange(newInputValue);
            }}
            renderInput={(params) => <TextField {...params} label="Query ID from catalog" />}
        />
        {options.includes(value) ?
            <Tooltip title="Edit query in the catalog">
                <IconButton onClick={() => {
                    window.open('/#/config/dj-query-catalog/' + value, '_blank');
                }
                }><Icon>edit</Icon></IconButton>
            </Tooltip>
            :
            <Tooltip title="Create query">
                <span>
                    <IconButton disabled={value ? false : true} onClick={async () => {
                        const data = loc.type === 'resource' ? {
                            id: value,
                            ID: value,
                            type: 'read',
                            // eslint-disable-next-line no-template-curly-in-string
                            query: 'select ${ID}',
                            arguments: {
                                ID: {
                                    type: 'string',
                                    sample: 'sample'
                                }
                            }
                        } : {
                            id: value,
                            ID: value,
                            type: 'read'
                        };
                        await dp.create('config/dj-query-catalog', { data })
                        window.open('/#/config/dj-query-catalog/' + value, '_blank');
                    }}><Icon>add</Icon></IconButton>
                </span>
            </Tooltip>
        }
    </Stack >
}

export default connectField(Queries)