import React, { useRef, useCallback, useEffect } from 'react';
import { Box, Typography, Paper, IconButton, Divider, Tooltip } from '@mui/material';
import { 
  FormatBold, FormatItalic, FormatUnderlined, FormatListBulleted, 
  FormatListNumbered, Link, Undo, Redo 
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const StyledToolbar = styled(Paper)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(1),
  borderRadius: `${theme.shape.borderRadius}px ${theme.shape.borderRadius}px 0 0`,
  borderBottom: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.default,
  gap: theme.spacing(0.5),
}));

const StyledEditor = styled(Box)(({ theme, error }) => ({
  minHeight: '200px',
  padding: theme.spacing(2),
  fontSize: '16px',
  lineHeight: 1.6,
  border: 'none',
  outline: 'none',
  backgroundColor: theme.palette.background.paper,
  borderRadius: `0 0 ${theme.shape.borderRadius}px ${theme.shape.borderRadius}px`,
  
  '&:focus': {
    outline: 'none',
  },
  
  // Placeholder styling
  '&:empty:before': {
    content: 'attr(data-placeholder)',
    color: theme.palette.text.disabled,
    fontStyle: 'italic',
    pointerEvents: 'none',
  },
  
  // Basic text formatting
  '& p': {
    margin: `${theme.spacing(0.5)} 0`,
    lineHeight: 1.6,
  },
  
  '& ul': {
    listStyleType: 'disc',
    paddingLeft: theme.spacing(3),
    margin: `${theme.spacing(1)} 0`,
  },
  
  '& ol': {
    listStyleType: 'decimal',
    paddingLeft: theme.spacing(3),
    margin: `${theme.spacing(1)} 0`,
  },
  
  '& li': {
    marginBottom: theme.spacing(0.5),
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
  
  '& a': {
    color: theme.palette.primary.main,
    textDecoration: 'none',
    '&:hover': {
      textDecoration: 'underline',
    },
  },
  
  // Error styling
  ...(error && {
    borderColor: theme.palette.error.main,
  }),
}));

const StyledContainer = styled(Paper)(({ theme, error }) => ({
  border: `1px solid ${error ? theme.palette.error.main : theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  overflow: 'hidden',
  
  '&:focus-within': {
    borderColor: theme.palette.primary.main,
    boxShadow: `0 0 0 1px ${theme.palette.primary.main}`,
  },
}));

const RichTextEditor = ({ 
  value = '', 
  onChange, 
  placeholder = 'Tulis deskripsi laporan Anda...', 
  error = false,
  helperText = '',
  label = '',
  minHeight = 200 
}) => {
  const editorRef = useRef(null);
  const isUpdatingRef = useRef(false);

  // Initialize editor content
  useEffect(() => {
    if (editorRef.current && !isUpdatingRef.current) {
      const editor = editorRef.current;
      if (editor.innerHTML !== value) {
        editor.innerHTML = value || '';
      }
    }
  }, [value]);

  // Handle content change
  const handleInput = useCallback(() => {
    if (editorRef.current && onChange) {
      isUpdatingRef.current = true;
      const content = editorRef.current.innerHTML;
      onChange(content);
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 0);
    }
  }, [onChange]);

  // Format commands
  const executeCommand = useCallback((command, value = null) => {
    document.execCommand(command, false, value);
    // Perbaikan: jika command adalah list, pastikan ada minimal satu <li>
    if (editorRef.current && (command === 'insertUnorderedList' || command === 'insertOrderedList')) {
      // Cari list yang baru saja dibuat
      const sel = window.getSelection();
      if (sel && sel.anchorNode) {
        let node = sel.anchorNode;
        // Cari parent <ul> atau <ol>
        while (node && node !== editorRef.current && node.nodeName !== 'UL' && node.nodeName !== 'OL') {
          node = node.parentNode;
        }
        if (node && (node.nodeName === 'UL' || node.nodeName === 'OL')) {
          // Jika list kosong, tambahkan <li><br></li>
          if (node.childNodes.length === 0) {
            const li = document.createElement('li');
            li.innerHTML = '<br>';
            node.appendChild(li);
            // Pindahkan kursor ke dalam <li>
            const range = document.createRange();
            range.selectNodeContents(li);
            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);
          }
        }
      }
    }
    editorRef.current?.focus();
    handleInput();
  }, [handleInput]);

  // Toolbar actions
  const toggleBold = () => executeCommand('bold');
  const toggleItalic = () => executeCommand('italic');
  const toggleUnderline = () => executeCommand('underline');
  const toggleBulletList = () => executeCommand('insertUnorderedList');
  const toggleNumberList = () => {
    const sel = window.getSelection();
    if (!sel || !editorRef.current) return executeCommand('insertOrderedList');
    let node = sel.anchorNode;
    // Cari parent <ul> atau <ol>
    while (node && node !== editorRef.current && node.nodeName !== 'UL' && node.nodeName !== 'OL') {
      node = node.parentNode;
    }
    if (!node || node === editorRef.current) {
      // Kursor di luar list, buat <ol><li><br></li></ol>
      executeCommand('insertOrderedList');
      // Perbaiki: jika list baru kosong, tambahkan <li><br></li>
      const ols = editorRef.current.querySelectorAll('ol');
      if (ols.length > 0) {
        const lastOl = ols[ols.length - 1];
        if (lastOl.childNodes.length === 0) {
          const li = document.createElement('li');
          li.innerHTML = '<br>';
          lastOl.appendChild(li);
        }
      }
      return;
    }
    if (node.nodeName === 'UL') {
      // Ubah <ul> jadi <ol>
      const ol = document.createElement('ol');
      // Salin semua <li>
      while (node.firstChild) {
        ol.appendChild(node.firstChild);
      }
      node.parentNode.replaceChild(ol, node);
      // Pindahkan kursor ke <ol>
      const range = document.createRange();
      range.selectNodeContents(ol);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
      handleInput();
      return;
    }
    // Jika di <li> kosong setelah <ul>, hapus <li> kosong, lalu buat <ol> baru
    if (node.nodeName === 'LI' && node.textContent.trim() === '') {
      const parent = node.parentNode;
      if (parent && parent.nodeName === 'UL') {
        parent.removeChild(node);
        executeCommand('insertOrderedList');
        return;
      }
    }
    // Default: toggle
    executeCommand('insertOrderedList');
  };
  const undo = () => executeCommand('undo');
  const redo = () => executeCommand('redo');
  
  const insertLink = () => {
    const url = prompt('Masukkan URL:');
    if (url) {
      executeCommand('createLink', url);
    }
  };

  // Handle key events
  const handleKeyDown = useCallback((e) => {
    // Handle keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          toggleBold();
          break;
        case 'i':
          e.preventDefault();
          toggleItalic();
          break;
        case 'u':
          e.preventDefault();
          toggleUnderline();
          break;
        case 'z':
          if (e.shiftKey) {
            e.preventDefault();
            redo();
          } else {
            e.preventDefault();
            undo();
          }
          break;
        default:
          break;
      }
    }
    
    // Handle Enter key for paragraph breaks
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      executeCommand('insertHTML', '<p><br></p>');
    }
  }, [toggleBold, toggleItalic, toggleUnderline, undo, redo]);

  // Handle paste to clean up formatting
  const handlePaste = useCallback((e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    executeCommand('insertText', text);
  }, []);

  return (
    <Box>
      {label && (
        <Typography 
          variant="body2" 
          color={error ? 'error' : 'text.secondary'}
          sx={{ mb: 1, fontWeight: 500 }}
        >
          {label}
        </Typography>
      )}
      
      <StyledContainer error={error}>
        <StyledToolbar elevation={0}>
          <Tooltip title="Bold (Ctrl+B)">
            <IconButton size="small" onClick={toggleBold}>
              <FormatBold fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Italic (Ctrl+I)">
            <IconButton size="small" onClick={toggleItalic}>
              <FormatItalic fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Underline (Ctrl+U)">
            <IconButton size="small" onClick={toggleUnderline}>
              <FormatUnderlined fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
          
          <Tooltip title="Bullet List">
            <IconButton size="small" onClick={toggleBulletList}>
              <FormatListBulleted fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Numbered List">
            <IconButton size="small" onClick={toggleNumberList}>
              <FormatListNumbered fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
          
          <Tooltip title="Insert Link">
            <IconButton size="small" onClick={insertLink}>
              <Link fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
          
          <Tooltip title="Undo (Ctrl+Z)">
            <IconButton size="small" onClick={undo}>
              <Undo fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Redo (Ctrl+Shift+Z)">
            <IconButton size="small" onClick={redo}>
              <Redo fontSize="small" />
            </IconButton>
          </Tooltip>
        </StyledToolbar>
        
        <StyledEditor
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning={true}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          error={error}
          sx={{ minHeight: minHeight }}
          data-placeholder={placeholder}
        />
      </StyledContainer>
      
      {helperText && (
        <Typography 
          variant="caption" 
          color={error ? 'error' : 'text.secondary'}
          sx={{ mt: 0.5, ml: 1.5, display: 'block' }}
        >
          {helperText}
        </Typography>
      )}
    </Box>
  );
};

export default RichTextEditor; 