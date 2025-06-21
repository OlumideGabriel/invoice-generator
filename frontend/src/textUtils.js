// textUtils.js
export const formatItemName = (text) => {
  if (!text) return '';

  const lines = text.split('\n');
  if (lines.length === 1) return lines[0];

  return (
    <>
      <strong>{lines[0]}</strong>
      {lines.slice(1).map((line, i) => (
        <React.Fragment key={i}>
          <br />
          <small>{line}</small>
        </React.Fragment>
      ))}
    </>
  );
};

export const handleTextAreaKeyDown = (e, callback) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    const textarea = e.target;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    // Insert a newline at the cursor position
    const value = textarea.value;
    textarea.value = value.substring(0, start) + '\n' + value.substring(end);

    // Move the cursor to after the newline
    textarea.selectionStart = textarea.selectionEnd = start + 1;

    // Update the state
    callback(textarea.value);

    // Auto-expand the textarea
    textarea.style.height = 'auto';
    textarea.style.height = (textarea.scrollHeight) + 'px';
  }
};