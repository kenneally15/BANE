// FeedbackDisplay.tsx
import React from 'react';

interface FeedbackDisplayProps {
  feedbackText: string;
}

const FeedbackDisplay: React.FC<FeedbackDisplayProps> = ({ feedbackText }) => {
  // 1. Split text into numbered points (based on "1.", "2.", etc.)
  const points = feedbackText.split(/\n?\s*\d+\.\s+/).filter(Boolean);

  return (
    <div className="p-4 bg-white rounded-xl shadow-md space-y-4">
      <h2 className="text-2xl font-bold mb-4">AI Feedback</h2>
      <ol className="list-decimal list-inside space-y-2">
        {points.map((point, idx) => (
          <li key={idx} className="text-gray-700 leading-relaxed">
            {highlightImportantPhrases(point)}
          </li>
        ))}
      </ol>
    </div>
  );
};

// 2. Highlight important keywords in each point
function highlightImportantPhrases(text: string) {
  // Simple rule: bold timestamps like 00h00m00s, important words
  const patterns = [
    { regex: /\b\d{2}h\d{2}m\d{2}s\b/g, className: "font-bold text-blue-700" },  // timestamps
    { regex: /\bSUCCESS\b|\bFAILURE\b|\bNEUTRALIZED\b|\bENGAGE\b/g, className: "font-bold text-green-700" },  // strong action words
    { regex: /\bF-22\b|\bF-35\b|\bB-1\b|\bE-3\b/g, className: "font-bold text-purple-700" }, // callsigns
    { regex: /\bSTRIKE\b|\bMAGIC\b|\bSATAN\b|\bHOSS\b/g, className: "font-bold text-indigo-600" }, // unit names
  ];

  let parts: React.ReactNode[] = [text];

  patterns.forEach(({ regex, className }) => {
    parts = parts.flatMap(part => {
      if (typeof part === "string") {
        const matches = part.split(regex);
        const tokens = [...part.matchAll(regex)];

        let result: React.ReactNode[] = [];
        matches.forEach((m, i) => {
          result.push(m);
          if (tokens[i]) {
            result.push(
              <span key={i + tokens[i].index} className={className}>
                {tokens[i][0]}
              </span>
            );
          }
        });
        return result;
      }
      return part;
    });
  });

  return <>{parts}</>;
}

export default FeedbackDisplay;
