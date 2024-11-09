import styled from "styled-components";
import Tab from '@mui/material/Tab';

/**
 * turn off default upper text transform for tabs
 */
export const AntTab = styled((props: any) => <Tab {...props} />)(
    ({ theme }) => ({
        textTransform: 'none',
    }),
);
