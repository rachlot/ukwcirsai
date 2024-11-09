import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useController } from 'react-hook-form';
import { util } from '../api/Util';
import { Schema } from '../model/schema';
import { useInput } from 'react-admin';

/**
 * handle form upload
 */
const Upload = ({ schema, validate }: { schema: Schema, validate: any }) => {

    const { fieldState } = useInput({ source: schema.name!, validate })

    const input = useController({ name: schema.name!, defaultValue: undefined });
    const upload = async (files: FileList, asURL: boolean, object: boolean, multiple?: boolean) => {
        const array = []
        for (let i = 0; i < files.length; i++) {
            const res = await util.read(files.item(i)!, asURL)
            let content
            try {
                if (object)
                    content = {
                        name: files.item(i)!.name,
                        lastModified: files.item(i)!.lastModified,
                        size: files.item(i)!.size,
                        type: files.item(i)!.type,
                        value: JSON.parse(res)
                    }
                else
                    content = JSON.parse(res)
            } catch (err) {
                if (object)
                    content = {
                        name: files.item(i)!.name,
                        lastModified: files.item(i)!.lastModified,
                        size: files.item(i)!.size,
                        type: files.item(i)!.type,
                        value: res
                    }
                else
                    content = res
            }
            if (multiple)
                array.push(content)
            else
                return content
        }
        return array
    }

    let preview: any = ''
    if (input.field.value?.name)
        preview = input.field.value.name
    if (typeof input.field?.value === 'string')
        preview = input.field.value.trim().substring(0, 10) + '...'

    return <Stack>
        <Stack direction={'row'}>
            <Typography sx={{ padding: 1 }}>{preview}</Typography>
            <Button variant="contained" component="label" color={fieldState.error ? 'error' : undefined}>
                Upload {schema.title ? schema.title : schema.name}
                <input hidden multiple={schema.multiple} type="file" onChange={async event => {
                    if (event.target.files) {
                        const value = await upload(event.target.files, schema.widget?.includes('binary') ? true : false, schema.widget?.includes('metadata') ? true : false, schema.multiple)
                        input.field.onChange(value)
                    }
                }} />
            </Button>
        </Stack>
        <Typography variant='caption' color='red'>{fieldState.error?.message}</Typography>
    </Stack>

}

export default Upload
