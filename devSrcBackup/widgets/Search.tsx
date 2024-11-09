import SearchIcon from '@mui/icons-material/Search';
import InputBase from '@mui/material/InputBase';
import { alpha, styled } from '@mui/material/styles';
import { useContext, useState } from 'react';
import { useNavigate } from 'react-router';
import { useLoc } from '../hooks/useLoc';
import { EditContext } from '../App';

/**
 * toolbar search 
 * styles taken from https://mui.com/material-ui/react-app-bar/#app-bar-with-search-field
 * 
 * the table / database input is not added since we can do this
 * more conveniently on the table level
 */
export const Search = () => {

    const loc = useLoc()
    const navigate = useNavigate()
    const edit = useContext(EditContext)

    const [search, setSearch] = useState<string>(loc.search ? loc.search : '')

    return (
        <SearchStyled>
            <SearchIconWrapper>
                <SearchIcon />
            </SearchIconWrapper>
            <StyledInputBase
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter')
                        if (search)
                            navigate('/search/' + encodeURIComponent(search))
                }}
                placeholder="Search…"
                value={search}
                inputProps={{ 'aria-label': 'search' }}
                disabled={edit}
            />
        </SearchStyled>
    );

}

/**
 * Metadata
 */
export const config = {
    id: 'search',
    // hidden in the left drawer
    hideInMenu: true,
}

export default Search

const SearchStyled = styled('div')(({ theme }) => ({
    position: 'relative',
    borderRadius: theme.shape.borderRadius,
    backgroundColor: alpha(theme.palette.common.white, 0.15),
    '&:hover': {
        backgroundColor: alpha(theme.palette.common.white, 0.25),
    },
    marginLeft: 0,
    width: '100%',
    [theme.breakpoints.up('sm')]: {
        marginLeft: theme.spacing(1),
        width: 'auto',
    },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
    padding: theme.spacing(0, 2),
    height: '100%',
    position: 'absolute',
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
    color: 'inherit',
    '& .MuiInputBase-input': {
        padding: theme.spacing(1, 1, 1, 0),
        // vertical padding + font size from searchIcon
        paddingLeft: `calc(1em + ${theme.spacing(4)})`,
        transition: theme.transitions.create('width'),
        width: '100%',
        [theme.breakpoints.up('sm')]: {
            width: '12ch',
            '&:focus': {
                width: '20ch',
            },
        },
    },
}));
