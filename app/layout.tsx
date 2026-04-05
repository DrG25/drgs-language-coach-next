export const metadata = {
  title: "Dr. G's Language Coach",
  description: "Practice speaking and listening with Dr. G's Language Coach.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
