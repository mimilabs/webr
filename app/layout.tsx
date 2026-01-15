import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "WebR API Server",
  description: "R code execution API using WebR on AWS EC2",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
