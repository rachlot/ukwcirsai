import { NestedMenuItem } from 'mui-nested-menu';
import SampleMenu from './SampleMenu';

/**
 * submenu component for the query editor
 * displays a double nested list of data samples (for between operator)
 */
const DoubleSampleMenu = ({ sample, onClick, parentMenuOpen }: { sample: any[], onClick: any, parentMenuOpen: any }) => {
    let counter = 0
    return <>
        {sample.map(item => <NestedMenuItem key={counter++} parentMenuOpen={parentMenuOpen} label={item + ' and'}>
            <SampleMenu sample={sample} onClick={(e: any) => onClick([typeof item === 'string' ? "'" + item + "'" : item, e])}></SampleMenu>
        </NestedMenuItem >)
        }
    </>
}

export default DoubleSampleMenu