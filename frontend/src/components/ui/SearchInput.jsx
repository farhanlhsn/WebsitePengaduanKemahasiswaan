import React, { useState, useRef } from 'react';
import { 
  TextField, 
  InputAdornment, 
  IconButton, 
  Box,
  Fade,
  Paper,
  List,
  ListItem,
  ListItemText,
  Typography
} from '@mui/material';
import { Search, Clear, FilterList } from '@mui/icons-material';
import { styled, alpha } from '@mui/material/styles';

const StyledSearchField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: 25,
    backgroundColor: alpha(theme.palette.background.paper, 0.8),
    backdropFilter: 'blur(10px)',
    transition: 'all 0.3s ease',
    border: `2px solid transparent`,
    
    '&:hover': {
      backgroundColor: theme.palette.background.paper,
      border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
    },
    
    '&.Mui-focused': {
      backgroundColor: theme.palette.background.paper,
      border: `2px solid ${theme.palette.primary.main}`,
      boxShadow: `0 0 0 4px ${alpha(theme.palette.primary.main, 0.1)}`,
    },
  },
  
  '& .MuiOutlinedInput-notchedOutline': {
    border: 'none',
  },
}));

const SearchSuggestions = styled(Paper)(({ theme }) => ({
  position: 'absolute',
  top: '100%',
  left: 0,
  right: 0,
  zIndex: 1000,
  marginTop: theme.spacing(1),
  borderRadius: 12,
  overflow: 'hidden',
  boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
}));

const SearchInput = ({ 
  value, 
  onChange, 
  placeholder = "Cari...", 
  suggestions = [],
  onSuggestionClick,
  showFilter = false,
  onFilterClick,
  ...props 
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);

  const handleClear = () => {
    onChange({ target: { value: '' } });
    inputRef.current?.focus();
  };

  const handleSuggestionClick = (suggestion) => {
    if (onSuggestionClick) {
      onSuggestionClick(suggestion);
    } else {
      onChange({ target: { value: suggestion } });
    }
    setShowSuggestions(false);
  };

  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      <StyledSearchField
        ref={inputRef}
        fullWidth
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        onFocus={() => {
          setFocused(true);
          setShowSuggestions(suggestions.length > 0);
        }}
        onBlur={() => {
          setFocused(false);
          // Delay hiding suggestions to allow clicking
          setTimeout(() => setShowSuggestions(false), 200);
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search 
                sx={{ 
                  color: focused ? 'primary.main' : 'text.secondary',
                  transition: 'color 0.3s ease'
                }} 
              />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                {value && (
                  <IconButton 
                    size="small" 
                    onClick={handleClear}
                    sx={{ 
                      opacity: 0.7,
                      '&:hover': { opacity: 1 }
                    }}
                  >
                    <Clear fontSize="small" />
                  </IconButton>
                )}
                {showFilter && (
                  <IconButton 
                    size="small" 
                    onClick={onFilterClick}
                    sx={{ 
                      opacity: 0.7,
                      '&:hover': { opacity: 1 }
                    }}
                  >
                    <FilterList fontSize="small" />
                  </IconButton>
                )}
              </Box>
            </InputAdornment>
          ),
        }}
        {...props}
      />
      
      {/* Search Suggestions */}
      <Fade in={showSuggestions && suggestions.length > 0}>
        <SearchSuggestions>
          <List dense>
            {suggestions.slice(0, 5).map((suggestion, index) => (
              <ListItem 
                key={index}
                button
                onClick={() => handleSuggestionClick(suggestion)}
                sx={{
                  '&:hover': {
                    backgroundColor: alpha('#2E7D32', 0.05),
                  }
                }}
              >
                <ListItemText 
                  primary={suggestion}
                  primaryTypographyProps={{
                    fontSize: '0.875rem'
                  }}
                />
              </ListItem>
            ))}
            {suggestions.length > 5 && (
              <ListItem>
                <Typography variant="caption" color="text.secondary">
                  +{suggestions.length - 5} more results...
                </Typography>
              </ListItem>
            )}
          </List>
        </SearchSuggestions>
      </Fade>
    </Box>
  );
};

export default SearchInput;