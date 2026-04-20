import { pdf, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
  },
  header: {
    fontSize: 10,
    marginBottom: 20,
    textAlign: 'right',
    color: '#666',
  },
  title: {
    fontSize: 18,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  content: {
    fontSize: 12,
    lineHeight: 1.5,
    whiteSpace: 'pre-wrap',
  },
});

/**
 * Strip code fences (```excalidraw, ```json, ``` etc.) and
 * trim the result before putting text into a PDF.
 */
function sanitizeContent(raw: string): string {
  return raw
    .replace(/```excalidraw[\s\S]*/g, '')   // remove open or closed excalidraw fence
    .replace(/```json[\s\S]*?```/gs, '')     // remove json fences
    .replace(/```[\s\S]*?```/gs, '')         // remove any other fences
    .replace(/\n{3,}/g, '\n\n')             // collapse excess blank lines
    .trim();
}

export const exportMemoPdf = async (memoData: { title: string; content: string }) => {
  const cleanContent = sanitizeContent(memoData.content);
  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>Memo Nexaflow DRH - {new Date().toLocaleDateString('fr-BE')}</Text>
        <Text style={styles.title}>{memoData.title}</Text>
        <Text style={styles.content}>{cleanContent}</Text>
      </Page>
    </Document>
  );

  const blob = await pdf(doc).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `memo-comex-${Date.now()}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
};
