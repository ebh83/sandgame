import './globals.css';

export const metadata = {
  title: 'Powder Toy',
  description: 'A falling sand simulation with fire, water, explosions, and chemical reactions',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
