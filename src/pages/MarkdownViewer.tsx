import React, { useEffect, useState } from 'react';
import Markdown from 'react-markdown';
import ReactMarkdown from 'react-markdown';

function MarkdownViewer({ markdownUrl }: { markdownUrl: string }) {
  const [content, setContent] = useState('');

  useEffect(() => {
    fetch(markdownUrl)
      .then((res) => res.text())
      .then((text) => setContent(text));
  }, [markdownUrl]);

  return (
    <div className="prose max-w-none">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}

export default MarkdownViewer;