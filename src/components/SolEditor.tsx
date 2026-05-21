import React, { useRef } from 'react';
import { Highlight, themes } from 'prism-react-renderer';
import { Box, Typography } from '@mui/material';

interface SolEditorProps {
  value: string;
  onChange: (v: string) => void;
  minRows?: number;
}

const FONT = '"Fira Mono", "Cascadia Code", "Consolas", monospace';
const FONT_SIZE = 13;
const LINE_HEIGHT = 1.6;

export default function SolEditor({ value, onChange, minRows = 20 }: SolEditorProps) {
  const taRef = useRef<HTMLTextAreaElement>(null);

  // Sync scroll between textarea and highlight layer
  const handleScroll = () => {
    const ta = taRef.current;
    const pre = ta?.parentElement?.querySelector('pre') as HTMLElement | null;
    if (ta && pre) {
      pre.scrollTop = ta.scrollTop;
      pre.scrollLeft = ta.scrollLeft;
    }
  };

  // Tab key support
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = e.currentTarget;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const next = value.substring(0, start) + '  ' + value.substring(end);
      onChange(next);
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 2;
      });
    }
  };

  const minHeight = `${minRows * FONT_SIZE * LINE_HEIGHT}px`;

  const sharedStyle: React.CSSProperties = {
    fontFamily: FONT,
    fontSize: FONT_SIZE,
    lineHeight: LINE_HEIGHT,
    padding: '12px 14px',
    margin: 0,
    border: 'none',
    outline: 'none',
    whiteSpace: 'pre',
    wordWrap: 'normal' as const,
    overflowWrap: 'normal' as const,
    tabSize: 2,
    minHeight,
    width: '100%',
    boxSizing: 'border-box' as const,
  };

  return (
    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 1.5,
          py: 0.5,
          bgcolor: '#1e1e2e',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <Typography sx={{ fontSize: 11, color: '#a6adc8', fontFamily: FONT }}>
          Solidity
        </Typography>
        <Typography sx={{ fontSize: 11, color: '#585b70', fontFamily: FONT }}>
          {value.split('\n').length} lines
        </Typography>
      </Box>

      {/* Editor container: highlight layer + textarea overlay */}
      <Box
        sx={{
          position: 'relative',
          bgcolor: '#1e1e2e',
          overflow: 'auto',
          maxHeight: 520,
        }}
      >
        {/* Syntax highlight layer (non-interactive) */}
        <Highlight theme={themes.nightOwl} code={value || ' '} language="javascript">
          {({ tokens, getLineProps, getTokenProps }) => (
            <Box
              component="pre"
              aria-hidden
              sx={{
                ...sharedStyle,
                position: 'absolute',
                top: 0,
                left: 0,
                pointerEvents: 'none',
                overflow: 'hidden',
                zIndex: 1,
                m: 0,
                color: 'inherit',
                background: 'transparent',
              }}
            >
              {tokens.map((line, i) => (
                <div key={i} {...getLineProps({ line })}>
                  {line.map((token, j) => (
                    <span key={j} {...getTokenProps({ token })} />
                  ))}
                </div>
              ))}
            </Box>
          )}
        </Highlight>

        {/* Editable textarea (transparent text, caret visible) */}
        <textarea
          ref={taRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onScroll={handleScroll}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          style={{
            ...sharedStyle,
            position: 'relative',
            zIndex: 2,
            background: 'transparent',
            color: 'transparent',
            caretColor: '#cdd6f4',
            resize: 'vertical',
            display: 'block',
          }}
        />
      </Box>
    </Box>
  );
}
