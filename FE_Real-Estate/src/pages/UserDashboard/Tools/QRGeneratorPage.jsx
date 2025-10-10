import QRGenerator from "@/components/payments/QRGenerator";

export default function QRGeneratorPage() {
  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ marginBottom: 12 }}>QR Generator</h2>
      <QRGenerator />
    </div>
  );
}
