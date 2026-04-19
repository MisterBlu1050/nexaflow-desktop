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

export const exportMemoPdf = async (memoData: { title: string; content: string }) => {
  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>Memo Nexaflow DRH - {new Date().toLocaleDateString('fr-BE')}</Text>
        <Text style={styles.title}>{memoData.title}</Text>
        <Text style={styles.content}>{memoData.content}</Text>
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
