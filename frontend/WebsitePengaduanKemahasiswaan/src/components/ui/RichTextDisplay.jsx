import React from 'react';
import { Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledRichTextContent = styled(Box)(({ theme }) => ({
  '& h1, & h2, & h3': {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(1),
    fontWeight: 600,
    color: theme.palette.text.primary,
  },
  
  '& h1': {
    fontSize: '1.5rem',
  },
  
  '& h2': {
    fontSize: '1.25rem',
  },
  
  '& h3': {
    fontSize: '1.125rem',
  },
  
  '& p': {
    marginBottom: theme.spacing(1),
    lineHeight: 1.6,
    color: theme.palette.text.primary,
  },
  
  '& strong': {
    fontWeight: 600,
  },
  
  '& em': {
    fontStyle: 'italic',
  },
  
  '& u': {
    textDecoration: 'underline',
  },
  
  '& s': {
    textDecoration: 'line-through',
  },
  
  '& ul, & ol': {
    marginLeft: theme.spacing(3),
    marginBottom: theme.spacing(1),
    
    '& li': {
      marginBottom: theme.spacing(0.5),
      lineHeight: 1.6,
    },
  },
  
  '& ul': {
    listStyleType: 'disc',
    
    '& ul': {
      listStyleType: 'circle',
      marginTop: theme.spacing(0.5),
    },
  },
  
  '& ol': {
    listStyleType: 'decimal',
    
    '& ol': {
      listStyleType: 'lower-alpha',
      marginTop: theme.spacing(0.5),
    },
  },
  
  '& a': {
    color: theme.palette.primary.main,
    textDecoration: 'none',
    
    '&:hover': {
      textDecoration: 'underline',
    },
  },
  
  '& blockquote': {
    borderLeft: `4px solid ${theme.palette.divider}`,
    paddingLeft: theme.spacing(2),
    margin: theme.spacing(2, 0),
    fontStyle: 'italic',
    color: theme.palette.text.secondary,
  },
  
  // First element margin top remove
  '& > *:first-of-type': {
    marginTop: 0,
  },
  
  // Last element margin bottom remove
  '& > *:last-child': {
    marginBottom: 0,
  },
}));

const RichTextDisplay = ({ 
  content = '', 
  variant = 'body1',
  maxLines = null,
}) => {
  // Utility function to strip HTML tags for plain text preview
  const getPlainText = (html) => {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  };

  // Truncate content if maxLines is specified and not showing full
  const shouldTruncate = maxLines && !showFull;
  const plainText = getPlainText(content);
  
  const displayContent = shouldTruncate 
    ? plainText.substring(0, (maxLines * 50)) + '...'
    : content;

  if (!content || (!content.trim())) {
    return (
      <Typography variant={variant} color="text.secondary" sx={{ fontStyle: 'italic' }}>
        Tidak ada deskripsi
      </Typography>
    );
  }

  return (
    <Box>
      {shouldTruncate ? (
        // Show plain text preview when truncated
        <Typography variant={variant} sx={{ lineHeight: 1.6 }}>
          {displayContent}
        </Typography>
      ) : (
        // Show rich HTML content when not truncated
        <StyledRichTextContent
          dangerouslySetInnerHTML={{ __html: content }}
          sx={{ 
            fontSize: variant === 'body2' ? '0.875rem' : '1rem',
            lineHeight: 1.6 
          }}
        />
      )}
      
    </Box>
  );
};

export default RichTextDisplay; 