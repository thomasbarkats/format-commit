import Code from './Code';
import InlineCode from './InlineCode';
import ConfigOption from './ConfigOption';


const CONTAINER_DEFAULTS = {
  card: 'bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-4 text-sm mb-4',
  warning: 'bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 text-sm text-slate-300 mb-4',
  section: 'border-b border-[var(--color-border)]/50 pb-6 text-sm space-y-4',
  steps: 'space-y-3 text-sm text-slate-400',
  group: 'space-y-8',
};

const HEADING_CLASSES = {
  1: 'text-3xl font-bold tracking-tight mb-2',
  2: 'text-xl font-semibold mb-4 text-white',
  3: 'text-lg font-semibold mt-8 mb-3 text-white',
  4: 'text-sm font-semibold text-white mb-2',
};

const TAG_MAP = {
  cfgh: { className: 'font-mono text-sm font-medium text-[var(--color-accent-light)] mb-2', el: 'h3' },
  result: { className: 'text-xs text-slate-500 -mt-2 pl-4', el: 'div' },
};

const HAS_COLOR_CLASS = /text-(slate|white|amber|red|green|blue|gray|zinc|orange|yellow|purple|pink|emerald|teal|sky|cyan|indigo|violet|rose)/;

function mergeClasses(defaults, extras) {
  if (!extras) { return defaults; }
  let result = defaults;
  for (const prefix of ['p-', 'rounded-', 'mb-', 'mt-']) {
    if (new RegExp(`\\b${prefix}\\w`).test(extras)) {
      result = result.replace(new RegExp(`\\b${prefix}\\w+`, 'g'), '');
    }
  }
  return [result, extras].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
}


function parseInline(text) {
  if (!text) { return null; }
  const parts = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    let earliest = null;
    let earliestIndex = remaining.length;

    const codeMatch = remaining.match(/`([^`]+)`/);
    if (codeMatch && codeMatch.index < earliestIndex) {
      earliest = { type: 'code', match: codeMatch };
      earliestIndex = codeMatch.index;
    }

    const boldMatch = remaining.match(/\*\*([^*]+)\*\*/);
    if (boldMatch && boldMatch.index < earliestIndex) {
      earliest = { type: 'bold', match: boldMatch };
      earliestIndex = boldMatch.index;
    }

    const tagMatch = remaining.match(/<(cfgh|result)>([\s\S]*?)<\/\1>/);
    if (tagMatch && tagMatch.index < earliestIndex) {
      earliest = { type: 'tag', match: tagMatch };
      earliestIndex = tagMatch.index;
    }

    const classInlineMatch = remaining.match(/\(([^)]*-[^)]*)\)([^\n]+)/);
    if (classInlineMatch && classInlineMatch.index < earliestIndex) {
      earliest = { type: 'classInline', match: classInlineMatch };
      earliestIndex = classInlineMatch.index;
    }

    if (!earliest) {
      parts.push(remaining);
      break;
    }

    if (earliestIndex > 0) {
      parts.push(remaining.slice(0, earliestIndex));
    }

    const { type, match } = earliest;
    if (type === 'code') {
      parts.push(<InlineCode key={key++}>{match[1]}</InlineCode>);
    } else if (type === 'bold') {
      parts.push(<strong key={key++}>{match[1]}</strong>);
    } else if (type === 'tag') {
      const tagDef = TAG_MAP[match[1]];
      const El = tagDef.el;
      let tagClasses = tagDef.className;
      let innerContent = match[2];
      const leadingClassMatch = innerContent.match(/^\(([^)]*-[^)]*)\)/);
      if (leadingClassMatch) {
        tagClasses = `${tagClasses} ${leadingClassMatch[1]}`;
        innerContent = innerContent.slice(leadingClassMatch[0].length);
      }
      parts.push(<El key={key++} className={tagClasses}>{parseInline(innerContent)}</El>);
    } else if (type === 'classInline') {
      parts.push(<span key={key++} className={match[1]}>{parseInline(match[2])}</span>);
    }

    remaining = remaining.slice(earliestIndex + match[0].length);
  }

  return parts.length === 1 && typeof parts[0] === 'string' ? parts[0] : parts;
}


function parseBlock(text, keyPrefix = '', ctx = {}) {
  const lines = text.split('\n');
  const elements = [];
  let key = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (trimmed === '') { continue; }

    const headingMatch = trimmed.match(/^(#{1,4})\s+(?:\(([^)]*-[^)]*)\))?(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const extraClasses = headingMatch[2] || '';
      const content = headingMatch[3].trim();
      const Tag = `h${level}`;
      let base = HEADING_CLASSES[level];
      if (ctx.headingColor) { base = base.replace('text-white', ctx.headingColor); }
      const classes = [base, extraClasses].filter(Boolean).join(' ');
      elements.push(<Tag key={`${keyPrefix}${key++}`} className={classes}>{parseInline(content)}</Tag>);
      continue;
    }

    const expanded = trimmed.startsWith(';;') ? trimmed.replace(/^;;\(/, '(space-y-2 ').replace(/^;;/, '(space-y-2)') : trimmed;
    const classBlockMatch = expanded.match(/^\(([^)]*-[^)]*)\)(.*)$/);
    if (classBlockMatch) {
      const classes = classBlockMatch[1];
      const content = classBlockMatch[2].trim();
      const hasColor = HAS_COLOR_CLASS.test(classes);
      if (content) {
        if (hasColor) {
          elements.push(
            <div key={`${keyPrefix}${key++}`} className={classes}>
              {parseInline(content)}
            </div>
          );
        } else {
          elements.push(
            <p key={`${keyPrefix}${key++}`} className={`text-slate-400 ${classes}`}>
              {parseInline(content)}
            </p>
          );
        }
      } else {
        const children = [];
        let childKey = 0;
        i++;
        while (i < lines.length && lines[i].trim() !== '' && !lines[i].trim().startsWith('```') && !lines[i].trim().startsWith(':::') && !lines[i].trim().startsWith('#')) {
          children.push(
            <div key={childKey++}>{parseInline(lines[i].trim())}</div>
          );
          i++;
        }
        i--;
        const wrapperClasses = hasColor ? classes : `text-slate-400 ${classes}`;
        elements.push(
          <div key={`${keyPrefix}${key++}`} className={wrapperClasses}>
            {children}
          </div>
        );
      }
      continue;
    }

    elements.push(
      <p key={`${keyPrefix}${key++}`} className="text-slate-400">
        {parseInline(trimmed)}
      </p>
    );
  }

  return elements;
}


function parseAttrs(attrString) {
  const attrs = {};
  const re = /(\w+)="([^"]*)"/g;
  let m;
  while ((m = re.exec(attrString)) !== null) {
    attrs[m[1]] = m[2];
  }
  return attrs;
}


function parseConfigBody(body, attrs) {
  const lines = body.split('\n').filter(l => l.trim());
  if (lines.length === 0) { return { description: attrs.description }; }

  // Check if lines look like options (start with number: or "value":)
  const optionPattern = /^(?:(\d+)|"([^"]+)"):\s*(.+)$/;
  const firstMatch = lines[0].trim().match(optionPattern);

  if (firstMatch && attrs.description) {
    // Lines are options
    const options = lines.map(line => {
      const m = line.trim().match(optionPattern);
      if (!m) { return null; }
      const value = m[1] || `"${m[2]}"`;
      const label = m[3].trim();
      return { value, label };
    }).filter(Boolean);
    return { description: attrs.description, options };
  }

  // Lines are description text (possibly multi-line with inline markup)
  if (lines.length === 1) {
    return { description: parseInline(lines[0].trim()) };
  }

  return {
    description: (
      <div className="text-sm text-slate-400 space-y-2">
        {lines.map((line, i) => <div key={i}>{parseInline(line.trim())}</div>)}
      </div>
    ),
  };
}


function parseTable(content) {
  const rows = content.split('\n').filter(l => l.trim().startsWith('|'));
  if (rows.length === 0) { return null; }

  const parseRow = (row) =>
    row.split('|').slice(1, -1).map(cell => cell.trim());

  const headerCells = parseRow(rows[0]);
  const bodyRows = rows.slice(1).map(parseRow);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--color-border)]">
            {headerCells.map((cell, i) => (
              <th key={i} className={`text-left py-3 ${i < headerCells.length - 1 ? 'pr-4' : ''} text-slate-500 font-medium`}>
                {parseInline(cell)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="text-slate-300">
          {bodyRows.map((cells, ri) => (
            <tr key={ri} className={ri < bodyRows.length - 1 ? 'border-b border-[var(--color-border)]/50' : ''}>
              {cells.map((cell, ci) => (
                <td key={ci} className={`py-3 ${ci < cells.length - 1 ? 'pr-4' : ''}`}>
                  {parseInline(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


function parseSegments(content, ctx = {}) {
  const trimmed = content.replace(/^\n+|\n+$/g, '');
  const lines = trimmed.split('\n');
  const elements = [];
  let key = 0;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();

    // Code fence
    const codeFenceMatch = line.match(/^```(\w*)$/);
    if (codeFenceMatch) {
      const lang = codeFenceMatch[1] || undefined;
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].trim().match(/^```$/)) {
        codeLines.push(lines[i]);
        i++;
      }
      i++;
      elements.push(<Code key={key++} lang={lang}>{codeLines.join('\n')}</Code>);
      continue;
    }

    // Container open: :::type or :::type(extra-classes)
    const containerMatch = line.match(/^:::(\w+)(?:\(([^)]*)\))?$/);
    if (containerMatch) {
      const type = containerMatch[1];
      const extraClasses = containerMatch[2] || '';
      i++;
      let depth = 1;
      const innerLines = [];
      while (i < lines.length && depth > 0) {
        const innerLine = lines[i].trim();
        if (innerLine.match(/^:::\w/)) {
          depth++;
          innerLines.push(lines[i]);
        } else if (innerLine === ':::') {
          depth--;
          if (depth > 0) { innerLines.push(lines[i]); }
        } else {
          innerLines.push(lines[i]);
        }
        i++;
      }

      const innerContent = innerLines.join('\n');

      // :::config — render ConfigOption
      if (type === 'config') {
        const attrs = parseAttrs(extraClasses);
        const { description, options } = parseConfigBody(innerContent, attrs);
        elements.push(
          <ConfigOption key={key++} name={attrs.name} description={description} options={options} />
        );
        continue;
      }

      // :::table — render HTML table
      if (type === 'table') {
        const tableEl = parseTable(innerContent);
        if (tableEl) {
          elements.push(<div key={key++}>{tableEl}</div>);
        }
        continue;
      }

      // :::options — list value cards
      if (type === 'options') {
        const blocks = innerContent.split(/\n\s*\n/).filter(b => b.trim());
        const cards = blocks.map((block, idx) => {
          const blockLines = block.split('\n').map(l => l.trim()).filter(Boolean);
          const firstMatch = blockLines[0].match(/^"([^"]+)"\s*(.*)/);
          if (!firstMatch) { return null; }
          const value = firstMatch[1];
          const label = firstMatch[2] || '';
          const descLines = blockLines.slice(1);
          return (
            <div key={idx} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-3 text-sm">
              <div className="font-mono text-xs text-slate-500 mb-1">{`"${value}"`}</div>
              {label && <p className="text-slate-300">{parseInline(label)}</p>}
              {descLines.map((dl, di) => (
                <div key={di} className="text-xs text-slate-400 mt-2">{parseInline(dl)}</div>
              ))}
            </div>
          );
        }).filter(Boolean);
        elements.push(<div key={key++} className={`space-y-3 ${extraClasses}`.trim()}>{cards}</div>);
        continue;
      }

      // :::examples — "Examples:" label + wrapped content
      if (type === 'examples') {
        const innerElements = parseSegments(innerContent, ctx);
        elements.push(
          <div key={key++} className={`mt-4 ${extraClasses}`.trim()}>
            <span className="text-xs text-slate-600">Examples:</span>
            <div className="mt-2 space-y-2">{innerElements}</div>
          </div>
        );
        continue;
      }

      // Standard containers
      const defaultClasses = CONTAINER_DEFAULTS[type] || '';
      const classes = mergeClasses(defaultClasses, extraClasses);
      const childCtx = type === 'warning' ? { ...ctx, headingColor: 'text-amber-200' } : ctx;

      if (type === 'steps') {
        const stepLines = innerContent.split('\n').filter(l => l.trim());
        const steps = stepLines.map((stepLine, idx) => (
          <div key={idx} className="flex gap-3">
            <div className="text-[var(--color-accent)] font-mono shrink-0">{idx + 1}.</div>
            <div>{parseInline(stepLine.trim())}</div>
          </div>
        ));
        elements.push(<div key={key++} className={classes}>{steps}</div>);
      } else {
        const innerElements = parseSegments(innerContent, childCtx);
        elements.push(<div key={key++} className={classes}>{innerElements}</div>);
      }
      continue;
    }

    // Skip empty lines
    if (line === '') {
      i++;
      continue;
    }

    // Collect text lines
    const textLines = [];
    while (i < lines.length) {
      const current = lines[i].trim();
      if (current.match(/^```/) || current.match(/^:::/)) { break; }
      if (current === '' && textLines.length > 0) {
        i++;
        break;
      }
      if (current !== '') {
        textLines.push(current);
      }
      i++;
    }

    if (textLines.length > 0) {
      const blockElements = parseBlock(textLines.join('\n'), `b${key}`, ctx);
      elements.push(...blockElements);
      key += blockElements.length;
    }
  }

  return elements;
}


function parseSections(content) {
  const lines = content.split('\n');
  const result = [];
  let currentId = null;
  let currentLines = [];
  let prefixLines = [];
  let inCodeFence = false;

  for (const line of lines) {
    if (line.trim().match(/^```/)) { inCodeFence = !inCodeFence; }

    const h2Match = !inCodeFence && line.match(/^## (.+)$/);
    if (h2Match) {
      if (currentId !== null) {
        result.push({ id: currentId, body: currentLines.join('\n').trim() });
      }
      const headingText = h2Match[1].replace(/\(([^)]*-[^)]*)\)/, '').trim();
      currentId = headingText.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      currentLines = [...prefixLines, line];
      prefixLines = [];
    } else if (currentId === null) {
      prefixLines.push(line);
    } else {
      currentLines.push(line);
    }
  }

  if (currentId !== null) {
    result.push({ id: currentId, body: currentLines.join('\n').trim() });
  }

  return result.map(({ id, body }) => (
    <section key={id} id={id} className="scroll-mt-24 mb-20">
      {parseSegments(body)}
    </section>
  ));
}


export default function MarkdownDocs({ content }) {
  return <>{parseSections(content)}</>;
}
