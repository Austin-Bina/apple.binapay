import React from "react";
import { Text, Linking, StyleSheet, StyleProp, TextStyle } from "react-native";

const BLUE = "#2563EB";

type Props = {
  html?: string | null;
  textStyle?: StyleProp<TextStyle>;
};

const URL_REGEX = /(https?:\/\/[^\s<]+)/g;

function decodeEntities(str: string): string {
  return str
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'");
}

function renderInline(line: string, keyPrefix: string): React.ReactNode[] {
  // Split on <strong>/<b>...</strong>/</b>, keeping the bold segments intact.
  const parts = line.split(/(<(?:strong|b)>.*?<\/(?:strong|b)>)/gi);

  return parts.flatMap((part, i) => {
    const boldMatch = part.match(/^<(?:strong|b)>([\s\S]*?)<\/(?:strong|b)>$/i);
    const raw = decodeEntities(boldMatch ? boldMatch[1] : part.replace(/<[^>]+>/g, ""));
    if (!raw) return [];

    // Split further on URLs so they render as tappable links.
    const segments = raw.split(URL_REGEX);
    return segments.filter(Boolean).map((seg, j) => {
      const key = `${keyPrefix}-${i}-${j}`;
      const isUrl = /^https?:\/\//.test(seg);
      if (isUrl) {
        return (
          <Text key={key} style={s.link} onPress={() => Linking.openURL(seg)}>
            {seg}
          </Text>
        );
      }
      return (
        <Text key={key} style={boldMatch ? s.bold : undefined}>
          {seg}
        </Text>
      );
    });
  });
}

/**
 * Renders backend-stored rich HTML (<p>, <br>, <strong>/<b>, plain URLs) as
 * native <Text>. Not a general HTML parser — covers exactly what the
 * notification composer actually produces. If richer markup shows up later
 * (lists, headings, images), swap this for react-native-render-html instead
 * of extending the regex parsing further.
 */
export default function HtmlText({ html, textStyle }: Props) {
  if (!html) return null;

  const paragraphs = html
    .split(/<\/p>/i)
    .map((p) => p.replace(/<p[^>]*>/i, "").trim())
    .filter(Boolean);

  const blocks = paragraphs.length > 0 ? paragraphs : [html];

  return (
    <Text style={textStyle}>
      {blocks.map((block, i) => {
        const lines = block.split(/<br\s*\/?>/i);
        return (
          <Text key={i}>
            {lines.map((line, j) => (
              <Text key={j}>
                {renderInline(line, `${i}-${j}`)}
                {j < lines.length - 1 ? "\n" : ""}
              </Text>
            ))}
            {i < blocks.length - 1 ? "\n\n" : ""}
          </Text>
        );
      })}
    </Text>
  );
}

const s = StyleSheet.create({
  bold: { fontWeight: "700" },
  link: { color: BLUE, textDecorationLine: "underline" },
});
