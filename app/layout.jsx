import '../styles/globals.css';

export const metadata = {
  title: 'RightsTrack — Legal & Civic Problem Assistant',
  description: 'Classify civic problems, generate citation-grounded documents, and track deadlines automatically.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,600;0,700;1,400&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-background text-on-background font-sans min-h-screen antialiased selection:bg-primary-container selection:text-white">
        {children}
      </body>
    </html>
  );
}
