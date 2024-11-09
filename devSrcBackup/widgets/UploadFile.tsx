import { Icon } from '@mui/material'
import { title } from '../api/Const'
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import { useState } from 'react';
import { useNotify } from 'react-admin';
import { util } from '../api/Util';
import { api } from '../api/Api';
import { fileOpen, directoryOpen, fileSave } from 'browser-fs-access';

export const UploadFile = ({ widget }: { widget: any }) => {

    const notify = useNotify()

    // dialog open state
    const [open, setOpen] = useState(false);
    const [progress, setProgress] = useState<number>();

    const uploadFilesAction = async (files: any) => {
        if (files.length === 0) {
            return;
        }

        let total = 0;
        for (let i = 0; i < files.length; i++) {
            const item = files.item ? files.item[i] : files[i];
            const sz = item.size;
            const path = item.name; //(item as any).webkitRelativePath ?
            //(item as any).webkitRelativePath : item.name;

            console.log("Upload file", path, sz);
            setProgress(i / files.length + 0.01);

            const data = await item.arrayBuffer();
            const res = await api.axios.put("rest/fs/home/upload/" + path, data);

            if (res.status >= 300)
                notify(`Upload error for file ${path} : ${res.status}`, { type: "error" });
            // else
            //     notify(`Uploaded ${path} (${sz} bytes)`);

            total = total + sz;
        }
        notify(`Uploaded ${files.length} files with ${total} bytes`);
        setProgress(undefined);
    }

    return <>
        <Stack spacing={2} direction="row">
            <Button
                disabled={progress !== undefined}
                variant="contained"
                onClick={async () => {
                    const dir = await directoryOpen({ recursive: widget.allowFolderSelectionRecursive });
                    let files = [];
                    for (const f of dir.values()) {
                        console.log(f);
                        files.push(f);
                    }

                    try {
                        await uploadFilesAction(files);
                    } catch (err) {
                        setProgress(undefined);
                        notify(util.error(err), { type: 'error' });
                    }
                }
                }
            >Select Folder</Button>
            <Button
                disabled={progress !== undefined}
                variant="contained"
                onClick={async () => {
                    const dir = await fileOpen({ multiple: true });
                    let files = [];
                    for (const f of dir.values()) {
                        console.log(f);
                        files.push(f);
                    }

                    try {
                        await uploadFilesAction(files);
                    } catch (err) {
                        setProgress(undefined);
                        notify(util.error(err), { type: 'error' });
                    }
                }
                }
            >Select Files</Button>
            <br />
            {progress && <progress value={progress} />}
        </Stack>
    </>;
}

export default UploadFile;

/**
 * Metadata
 */
export const config = {
    id: 'uploadfile',

    // capitalized version
    title: 'Upload File',

    // hidden in the left drawer
    hideInMenu: true,

    // description in widget chooser
    description: 'Upload documents',
    version: 1,

    icon: <Icon>edit_note</Icon>,
    controls: {
        type: 'autoform',
        schema: {
            properties: {
                title: title,
                allowMultipleSelection: { title: "Allow multiple files (default=true)", type: "boolean", default: true },
                allowFolderSelection: { title: "Allow folder upload (default=true)", type: "boolean", default: true },
                extensions: { title: "Allowed file extensions (default=*)", type: "string", default: "*" },
            },
        },
    }
}
