import MenuItem from '@mui/material/MenuItem';

/**
 * submenu component for the query editor
 * displays a list of data samples
 */
const SampleMenu = ({ sample, onClick }: { sample: any[], onClick: any }) => {
    let counter = 0
    return <>
        {sample.map(item => <MenuItem key={counter++} onClick={_ => onClick(typeof item === 'string' ? "'" + item + "'" : item)}>{item}</MenuItem>)}
    </>
}

export default SampleMenu