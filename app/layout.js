// 📁 ragchat/app/layout.js
import "./globals.css";

export const metadata = {
  title: "RAGChat — Docs Intelligence",
  description: "Upload any PDF, text, or website. Ask questions. Get answers grounded in your documents.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,300;0,400;0,500;1,300&family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ margin: 0, background: "#070d18", overflow: "hidden" }}>
        {children}
      </body>
    </html>
  );
}